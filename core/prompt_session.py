# core/prompt_session.py

import os
import sqlite3
from dotenv import load_dotenv
from datetime import datetime
from openai import OpenAI  # ✅ New import for the modern SDK

load_dotenv()
client = OpenAI()  # ✅ New way to access OpenAI, reads key from .env

class PromptSession:
    def __init__(self, db_path="db/logs.db"):
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
                timestamp TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def ask_gpt(self, prompt):
        # ✅ Updated method using new SDK style
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        result = response.choices[0].message.content
        self._log_to_db(prompt, result)
        return result

    def _log_to_db(self, prompt, response):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO prompts (prompt, response, timestamp) VALUES (?, ?, ?)",
                       (prompt, response, datetime.now().isoformat()))
        conn.commit()
        conn.close()
