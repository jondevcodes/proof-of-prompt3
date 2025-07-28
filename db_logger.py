import sqlite3
from datetime import datetime
from typing import Optional

def init_db():
    conn = sqlite3.connect("proofs.db")  # Changed path
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT NOT NULL,
            response TEXT NOT NULL,
            local_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            tx_hash TEXT NULL,
            block_number INTEGER NULL
        )
    ''')
    conn.commit()
    conn.close()

def log_proof(
    prompt: str,
    response: str,
    local_hash: str,
    tx_hash: Optional[str] = None,
    block_number: Optional[int] = None
):
    conn = sqlite3.connect("proofs.db")
    cursor = conn.cursor()
    
    if tx_hash:
        cursor.execute('''
            INSERT INTO prompts 
            (prompt, response, local_hash, tx_hash, block_number)
            VALUES (?, ?, ?, ?, ?)
        ''', (prompt, response, local_hash, tx_hash, block_number))
    else:
        cursor.execute('''
            INSERT INTO prompts (prompt, response, local_hash)
            VALUES (?, ?, ?)
        ''', (prompt, response, local_hash))
    
    conn.commit()
    conn.close()