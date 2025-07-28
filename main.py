from db_logger import init_db
init_db()
from fastapi import FastAPI, Request
from pydantic import BaseModel
from prompt_handler import ask_gpt
from db_logger import log_to_db
import hashlib
import sqlite3
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Optional: Enable CORS for frontend usage
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schema
class PromptRequest(BaseModel):
    prompt: str

class VerifyRequest(BaseModel):
    hash: str

@app.post("/prompt")
async def generate_response(request: PromptRequest):
    prompt = request.prompt
    response = ask_gpt(prompt)
    
    # Generate SHA256 hash
    combined = f"{prompt}{response}".encode('utf-8')
    hash_value = hashlib.sha256(combined).hexdigest()

    # Log to SQLite
    log_to_db(prompt, response, hash_value)

    return {
        "prompt": prompt,
        "response": response,
        "hash": hash_value
    }

@app.post("/verify")
async def verify_hash(request: VerifyRequest):
    hash_to_check = request.hash

    conn = sqlite3.connect("db/logs.db")
    cursor = conn.cursor()
    cursor.execute("SELECT prompt, response, timestamp FROM prompts WHERE hash=?", (hash_to_check,))
    result = cursor.fetchone()
    conn.close()

    if result:
        return {
            "match": True,
            "prompt": result[0],
            "response": result[1],
            "timestamp": result[2]
        }
    else:
        return { "match": False }

@app.get("/history")
async def get_history():
    conn = sqlite3.connect("db/logs.db")
    cursor = conn.cursor()
    cursor.execute("SELECT prompt, response, hash, timestamp FROM prompts ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()

    return {
        "logs": [
            {
                "prompt": row[0],
                "response": row[1],
                "hash": row[2],
                "timestamp": row[3]
            } for row in rows
        ]
    }
