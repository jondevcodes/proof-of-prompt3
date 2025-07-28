import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect("db/logs.db")
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

def log_to_db(prompt, response, hash_value):
    conn = sqlite3.connect("db/logs.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO prompts (prompt, response, hash, timestamp) VALUES (?, ?, ?, ?)",
        (prompt, response, hash_value, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
