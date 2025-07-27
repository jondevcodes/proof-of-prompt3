import os
import sqlite3
import hashlib
from datetime import datetime
from openai import OpenAI  # ✅ Modern SDK

class PromptSession:
    """
    Manages GPT interactions and logs prompt-response pairs into a local SQLite database.
    """

    def __init__(self, api_key, db_path="db/logs.db"):
        self.client = OpenAI(api_key=api_key)
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt TEXT,
                response TEXT,
                hash TEXT,
                timestamp TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def ask_gpt(self, prompt):
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        result = response.choices[0].message.content

        combined = prompt + result
        hash_hex = hashlib.sha256(combined.encode('utf-8')).hexdigest()
        timestamp = datetime.utcnow().isoformat()

        self._log_to_db(prompt, result, hash_hex, timestamp)

        return {
            "response": result,
            "hash": hash_hex,
            "timestamp": timestamp
        }

    def _log_to_db(self, prompt, response, hash_hex, timestamp):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO prompts (prompt, response, hash, timestamp) VALUES (?, ?, ?, ?)",
            (prompt, response, hash_hex, timestamp)
        )
        conn.commit()
        conn.close()

    def verify_hash(self, hash_val):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT prompt, response, timestamp FROM prompts WHERE hash = ?",
            (hash_val,)
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                "prompt": row[0],
                "response": row[1],
                "timestamp": row[2]
            }
        else:
            return None

