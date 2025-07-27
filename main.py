import hashlib
import sqlite3
from datetime import datetime

@app.post("/prompt")
def get_gpt_response(request: PromptRequest):
    try:
        # 1. Generate response
        response = session.ask_gpt(request.prompt)

        # 2. Create hash
        combined = f"{request.prompt}{response}".encode('utf-8')
        hash_val = hashlib.sha256(combined).hexdigest()

        # 3. Timestamp
        timestamp = datetime.utcnow().isoformat()

        # 4. Save to SQLite
        conn = sqlite3.connect("prompts.db")
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt TEXT,
                response TEXT,
                hash TEXT,
                timestamp TEXT
            );
        """)
        cursor.execute("""
            INSERT INTO prompts (prompt, response, hash, timestamp)
            VALUES (?, ?, ?, ?)
        """, (request.prompt, response, hash_val, timestamp))
        conn.commit()
        conn.close()

        # 5. Return result
        return {
            "prompt": request.prompt,
            "response": response,
            "hash": hash_val,
            "timestamp": timestamp
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
