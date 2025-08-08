import os
import hashlib
import logging
from datetime import datetime
from typing import Optional
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
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
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ProofOfPromptAPI")

# Load environment variables - MUST BE FIRST
load_dotenv()

# Critical startup logging
logger.info("🚀 Starting Proof-of-Prompt API")
logger.info(f"Environment: {os.environ.get('ENVIRONMENT', 'development')}")
logger.info(f"Python version: {os.sys.version}")

# Validate critical env vars
required_env_vars = ['OPENAI_API_KEY', 'CONTRACT_ADDRESS', 'WEB3_PROVIDER_URL']
missing_vars = [v for v in required_env_vars if not os.getenv(v)]
if missing_vars:
    logger.critical(f"Missing environment variables: {missing_vars}")
    # Don't crash immediately - might be running in test mode
    if os.environ.get("ENVIRONMENT") == "production":
        raise RuntimeError(f"Missing critical environment variables: {missing_vars}")

# Database setup - just create engine here
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///proofs.db")
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

# Add CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://frontend-proof-of-prompt-restored-3i7u75dcx.vercel.app",
        "https://frontend-proof-of-prompt-restored-88sayy96i.vercel.app",
        "https://frontend-proof-of-prompt-restored-5yhr41vg8.vercel.app",
        "https://frontend-proof-of-prompt-restored-94lz8lgw3.vercel.app",
        "https://frontend-proof-of-prompt-restored-6ahfpijhg.vercel.app",
        "https://frontend-proof-of-prompt-restored-1ooa0o73p.vercel.app",
        "https://frontend-proof-of-prompt-restored-6ahfpijhg.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Rate limiter setup - moved after app creation
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Initialize DB on startup
@app.on_event("startup")
def init_db():
    logger.info("Initializing database...")
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

# Initialize blockchain on startup with timeout
@app.on_event("startup")
def init_blockchain_app():
    global w3, contract
    w3, contract = None, None
    
    logger.info("Initializing blockchain connection...")
    try:
        w3, contract = init_blockchain()
        logger.info("✅ Blockchain initialized successfully")
    except Exception as e:
        logger.error(f"❌ Blockchain initialization failed: {str(e)}")

# Models
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

# Add root endpoint
@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "Proof-of-Prompt API",
        "version": "1.0",
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "endpoints": {
            "docs": "/docs",
            "generate": "/prompt (POST)",
            "verify": "/verify (POST)",
            "health": "/health"
        }
    }

@app.post("/prompt", response_model=ProofResponse)
@limiter.limit("20/minute")
async def create_proof(request_data: PromptRequest, request: Request):
    try:
        response, proof_hash = generate_proof(
            prompt=request_data.prompt,
            model=request_data.model,
            temperature=request_data.temperature
        )
    except (APIConnectionError, RateLimitError, APIError) as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(500, detail=f"AI service error: {str(e)}")
    except RuntimeError as e:
        logger.error(f"Proof generation failed: {str(e)}")
        raise HTTPException(500, detail="Failed to generate proof")
    except Exception as e:
        logger.exception("Unexpected error during proof generation")
        raise HTTPException(500, detail="Internal server error")

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

    blockchain_result = {"status": "pending"}
    try:
        if w3 and contract:
            tx_receipt = anchor_prompt_hash(proof_hash, w3, contract)
            blockchain_result = {
                "status": "confirmed",
                "tx_hash": tx_receipt.transactionHash.hex(),
                "block_number": tx_receipt.blockNumber,
                "gas_used": tx_receipt.gasUsed,
                "explorer_url": f"https://sepolia.etherscan.io/tx/{tx_receipt.transactionHash.hex()}"
            }
            
            try:
                with get_db() as db:
                    db.execute(
                        text("UPDATE prompts SET blockchain_tx = :tx WHERE local_hash = :h"),
                        {"tx": tx_receipt.transactionHash.hex(), "h": hex_hash}
                    )
                    db.commit()
            except Exception as e:
                logger.error(f"Failed to update blockchain_tx: {str(e)}")
        else:
            logger.warning("Blockchain not initialized, skipping anchoring")
            blockchain_result = {"status": "blockchain_disabled"}
    except Exception as e:
        logger.warning(f"Blockchain anchoring failed: {str(e)}")
        blockchain_result = {
            "status": "failed",
            "error": str(e)
        }

    return {
        "prompt": request_data.prompt,
        "response": response,
        "local_hash": hex_hash,
        "timestamp": timestamp,
        "blockchain": blockchain_result
    }

# Add missing /verify endpoint
@app.post("/verify", response_model=dict)
@limiter.limit("30/minute")
async def verify_proof(request_data: VerificationRequest, request: Request):
    try:
        # Generate hash from prompt + response
        proof_data = f"{request_data.prompt}{request_data.response}".encode('utf-8')
        proof_hash = hashlib.sha256(proof_data).digest()
        
        # Verify on blockchain
        verification_result = verify_on_chain(proof_hash)
        
        return {
            "verified": verification_result.get("exists", False),
            "hash": proof_hash.hex(),
            "blockchain": verification_result
        }
    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        raise HTTPException(500, detail="Verification failed")

# Add missing /api/proofs/{txHash} endpoint
@app.get("/api/proofs/{tx_hash}")
async def get_proof_by_tx(tx_hash: str):
    try:
        with get_db() as db:
            result = db.execute(
                text("SELECT * FROM prompts WHERE blockchain_tx = :tx"),
                {"tx": tx_hash}
            ).fetchone()
            
            if not result:
                raise HTTPException(404, detail="Proof not found")
            
            return {
                "prompt": result.prompt,
                "response": result.response,
                "local_hash": result.local_hash,
                "timestamp": result.timestamp,
                "blockchain_tx": result.blockchain_tx,
                "model": result.model
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database query failed: {str(e)}")
        raise HTTPException(500, detail="Database error")

# Health check endpoint with dependency checks
@app.get("/health")
async def health():
    status = {
        "status": "ok",
        "services": {
            "database": "ok",
            "blockchain": "ok" if w3 and contract else "disabled",
            "ai": "ok"
        }
    }
    
    # Add detailed checks if needed
    if not w3 or not contract:
        status["services"]["blockchain"] = "disabled"
    
    return status

# Run with uvicorn when executed directly
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)