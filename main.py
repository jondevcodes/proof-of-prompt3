import os
import json
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
from dotenv import load_dotenv
from openai import OpenAI
from web3 import Web3, exceptions

# Blockchain setup
load_dotenv()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ProofOfPromptAPI")

# Ensure critical env vars exist
required_vars = ['OPENAI_API_KEY', 'CONTRACT_ADDRESS', 'WEB3_PROVIDER_URL']
missing = [v for v in required_vars if not os.getenv(v)]
if missing:
    raise RuntimeError(f"Missing env vars: {missing}")

# Web3 initialization

def init_blockchain():
    w3 = Web3(Web3.HTTPProvider(
        os.getenv('WEB3_PROVIDER_URL'),
        request_kwargs={'timeout': 15}
    ))
    if not w3.is_connected():
        raise ConnectionError("Web3 provider unreachable")

    account = None
    if 'PRIVATE_KEY' in os.environ:
        account = w3.eth.account.from_key(os.getenv('PRIVATE_KEY'))
    return w3, account

def get_contract(w3):
    contract_address = os.getenv("CONTRACT_ADDRESS")
    abi = [
        {
            "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
            "name": "anchorHash",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
            "name": "verifyHash",
            "outputs": [
                {"internalType": "bool", "name": "", "type": "bool"},
                {"internalType": "uint256", "name": "", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
    return w3.eth.contract(address=contract_address, abi=abi)

def anchor_prompt_hash(prompt_hash: bytes):
    w3, account = init_blockchain()
    if not account:
        raise ValueError("No signing account configured")
    contract = get_contract(w3)
    tx = contract.functions.anchorHash(prompt_hash).build_transaction({
        'chainId': w3.eth.chain_id,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 150000,
        'maxFeePerGas': w3.to_wei('25', 'gwei'),
        'maxPriorityFeePerGas': w3.to_wei('2', 'gwei'),
    })
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    return {
        "status": "confirmed" if receipt.status == 1 else "failed",
        "tx_hash": tx_hash.hex(),
        "block_number": receipt.blockNumber,
        "gas_used": receipt.gasUsed
    }

def verify_on_chain(prompt_hash: bytes):
    w3, _ = init_blockchain()
    contract = get_contract(w3)
    exists, timestamp = contract.functions.verifyHash(prompt_hash).call()
    return {"exists": exists, "timestamp": timestamp}

# OpenAI handler

def generate_proof(prompt: str, model: str, temperature: float):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    completion = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[{"role": "user", "content": prompt}]
    )
    result = completion.choices[0].message.content
    prompt_hash = hashlib.sha256(f"{prompt}{result}".encode()).digest()
    return result, prompt_hash

# DB setup
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
init_db()

# FastAPI setup
app = FastAPI(title="Proof-of-Prompt")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://frontend-proof-of-prompt.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Models
class PromptRequest(BaseModel):
    prompt: str
    model: str = "gpt-4o"
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
    response, proof_hash = generate_proof(request_data.prompt, request_data.model, request_data.temperature)
    hex_hash = proof_hash.hex()
    timestamp = datetime.utcnow().isoformat()
    with get_db() as db:
        db.execute(text("INSERT INTO prompts (prompt, response, timestamp, local_hash, model, temperature) VALUES (:p, :r, :t, :h, :m, :temp)"),
                   {"p": request_data.prompt, "r": response, "t": timestamp, "h": hex_hash, "m": request_data.model, "temp": request_data.temperature})
        db.commit()
    try:
        blockchain_result = anchor_prompt_hash(proof_hash)
        blockchain_result["explorer_url"] = f"https://sepolia.etherscan.io/tx/{blockchain_result['tx_hash']}"
        with get_db() as db:
            db.execute(text("UPDATE prompts SET blockchain_tx = :tx WHERE local_hash = :h"),
                       {"tx": blockchain_result["tx_hash"], "h": hex_hash})
            db.commit()
    except Exception as e:
        logger.warning(f"Blockchain anchoring failed: {e}")
        blockchain_result = {"status": "local_only"}

    return {
        "prompt": request_data.prompt,
        "response": response,
        "local_hash": hex_hash,
        "timestamp": timestamp,
        "blockchain": blockchain_result
    }

@app.post("/verify")
@limiter.limit("50/minute")
async def verify_proof(request_data: VerificationRequest, request: Request):
    proof_hash = hashlib.sha256(f"{request_data.prompt}{request_data.response}".encode()).digest()
    hex_hash = proof_hash.hex()
    with get_db() as db:
        record = db.execute(text("SELECT timestamp, model FROM prompts WHERE local_hash = :h"),
                            {"h": hex_hash}).fetchone()
    try:
        on_chain = verify_on_chain(proof_hash)
    except Exception:
        on_chain = {"exists": False}
    return {
        "on_chain": on_chain,
        "local_record": bool(record),
        "consistency_check": bool(record) and on_chain.get("exists", False)
    }
