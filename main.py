# main.py
import os
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# Import PromptSession after loading env vars
from core.prompt_session import PromptSession
session = PromptSession(api_key=api_key)

# Initialize FastAPI app
app = FastAPI()

# Define Pydantic model for request body
class PromptRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return JSONResponse(content={"message": "ChainGPT Tracker is live 🧠"})

@app.post("/prompt")
def get_gpt_response(request: PromptRequest):
    try:
        result = session.ask_gpt(request.prompt)
        return {
            "prompt": request.prompt,
            "response": result["response"],
            "hash": result["hash"],
            "timestamp": result["timestamp"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/verify")
def verify_hash(hash: str = Query(..., description="SHA-256 hash to verify")):
    try:
        result = session.verify_hash(hash)
        if result:
            return {
                "match": True,
                "prompt": result["prompt"],
                "response": result["response"],
                "timestamp": result["timestamp"]
            }
        else:
            return {"match": False, "message": "Hash not found in database."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
