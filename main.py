import os
import hashlib
import logging
from datetime import datetime
from typing import Optional
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, confloat
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from blockchain import anchor_prompt_hash, verify_on_chain, init_blockchain
from dotenv import load_dotenv
from openai import OpenAI, APIConnectionError, RateLimitError, APIError

from prompt_handler import generate_proof

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    handlers=[logging.StreamHandler(), logging.FileHandler('debug.log')]
)
logger = logging.getLogger("ProofOfPromptAPI")

# Load environment variables
load_dotenv()

# Validate critical env vars
required_env_vars = ['OPENAI_API_KEY', 'CONTRACT_ADDRESS', 'WEB3_PROVIDER_URL']
missing_vars = [v for v in required_env_vars if not os.getenv(v)]
if missing_vars:
    logger.critical(f"Missing environment variables: {missing_vars}")
    raise RuntimeError(f"Missing critical environment variables: {missing_vars}")

# Database setup
DATABASE_URL = "sqlite:///proofs.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(
    title="Proof-of-Prompt API",
    description="Cryptographic AI content verification system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Database initialization
def init_db():
    with engine.begin() as conn:
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY,
                prompt TEXT NOT NULL,
                response TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                local_hash TEXT NOT NULL,
                blockchain_tx TEXT NULL,
                model TEXT NOT NULL,
                temperature REAL NULL
            )
        '''))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_hash ON prompts(local_hash)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_tx ON prompts(blockchain_tx)"))
    logger.info("Database initialized.")

init_db()

# Pydantic models
class PromptRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    model: str = Field("gpt-4o", pattern="^(gpt-4o|gpt-3.5-turbo|claude-3)$")
    temperature: Optional[confloat(ge=0, le=2)] = 0.7

class VerificationRequest(BaseModel):
    prompt: str
    response: str

class ProofResponse(BaseModel):
    prompt: str
    response: str
    local_hash: str
    timestamp: str
    blockchain: dict

@app.post("/prompt", response_model=ProofResponse)
@limiter.limit("20/minute")
async def create_proof(request_data: PromptRequest, request: Request):
    try:
        response, proof_hash = generate_proof(
            prompt=request_data.prompt,
            model=request_data.model,
            temperature=request_data.temperature
        )
    except RuntimeError as e:
        logger.error(f"Failed to get AI response: {e}")
        raise HTTPException(500, detail="Failed to get AI response")

    hex_hash = proof_hash.hex()
    timestamp = datetime.utcnow().isoformat()

    try:
        with get_db() as db:
            db.execute(
                text("INSERT INTO prompts (prompt, response, timestamp, local_hash, model, temperature) VALUES (:p, :r, :t, :h, :m, :temp)"),
                {"p": request_data.prompt, "r": response, "t": timestamp, "h": hex_hash, "m": request_data.model, "temp": request_data.temperature}
            )
            db.commit()
    except Exception as e:
        logger.error(f"Database insert failed: {str(e)}")
        raise HTTPException(503, "Database operation failed")

    try:
        blockchain_result = anchor_prompt_hash(proof_hash)
    except Exception as e:
        logger.warning(f"Blockchain anchoring failed, continuing locally: {str(e)}")
        blockchain_result = {"status": "local_only"}

    if "tx_hash" in blockchain_result:
        try:
            with get_db() as db:
                db.execute(
                    text("UPDATE prompts SET blockchain_tx = :tx WHERE local_hash = :h"),
                    {"tx": blockchain_result["tx_hash"], "h": hex_hash}
                )
                db.commit()
            blockchain_result["explorer_url"] = f"https://sepolia.etherscan.io/tx/{blockchain_result['tx_hash']}"
        except Exception as e:
            logger.error(f"Failed to update blockchain_tx: {str(e)}")

    return {
        "prompt": request_data.prompt,
        "response": response,
        "local_hash": hex_hash,
        "timestamp": timestamp,
        "blockchain": blockchain_result
    }

@app.post("/verify", response_model=dict)
@limiter.limit("50/minute")
async def verify_proof(request_data: VerificationRequest, request: Request):
    proof_hash = hashlib.sha256(f"{request_data.prompt}{request_data.response}".encode()).digest()
    hex_hash = proof_hash.hex()

    try:
        with get_db() as db:
            record = db.execute(
                text("SELECT timestamp, model FROM prompts WHERE local_hash = :h"),
                {"h": hex_hash}
            ).fetchone()
    except Exception as e:
        logger.error(f"Database query failed: {str(e)}")
        raise HTTPException(503, "Database operation failed")

    try:
        on_chain = verify_on_chain(proof_hash)
    except Exception as e:
        logger.warning(f"Blockchain verification failed: {str(e)}")
        on_chain = {"exists": False}

    return {
        "on_chain": on_chain,
        "local_record": bool(record),
        "consistency_check": bool(record) and on_chain.get("exists", False)
    }

@app.get("/proof/{tx_hash}", response_model=dict)
@limiter.limit("100/minute")
async def get_proof(tx_hash: str, request: Request):
    try:
        with get_db() as db:
            result = db.execute(
                text("SELECT prompt, response, timestamp, model FROM prompts WHERE blockchain_tx = :tx"),
                {"tx": tx_hash}
            ).fetchone()
    except Exception as e:
        logger.error(f"Database query failed: {str(e)}")
        raise HTTPException(503, "Database operation failed")

    if not result:
        raise HTTPException(404, "Proof not found for this transaction hash")

    return {
        "prompt": result[0],
        "response": result[1],
        "timestamp": result[2],
        "model": result[3],
        "explorer_url": f"https://sepolia.etherscan.io/tx/{tx_hash}"
    }

@app.get("/health")
async def health():
    return {"status": "ok", "services": ["db", "blockchain", "ai"]}

@app.get("/debug/check_connections")
async def debug_check_connections():
    checks = {"openai": False, "database": False, "blockchain": False}

    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        client.models.list()
        checks["openai"] = True
    except Exception as e:
        logger.error(f"OpenAI check failed: {e}")

    try:
        with get_db() as db:
            db.execute(text("SELECT 1"))
            checks["database"] = True
    except Exception as e:
        logger.error(f"Database check failed: {e}")

    try:
        w3, _ = init_blockchain()
        checks["blockchain"] = w3.is_connected()
    except Exception as e:
        logger.error(f"Blockchain check failed: {e}")

    return checks
