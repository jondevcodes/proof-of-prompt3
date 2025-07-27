# main.py

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from core.prompt_session import PromptSession

app = FastAPI()
session = PromptSession()

class PromptRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return JSONResponse(content={"message": "ChainGPT Tracker is live 🧠"})

@app.post("/prompt")
def get_gpt_response(request: PromptRequest):
    try:
        response = session.ask_gpt(request.prompt)
        return {
            "prompt": request.prompt,
            "response": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
