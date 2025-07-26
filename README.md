# 🧠 proof-of-prompt

A simple command-line app that sends a prompt to GPT-4o and logs the response with timestamps in JSON format.

## 🚀 Features

- Uses `openai` and `.env` for secure API key management
- Automatically logs prompts and responses to `logs/logs.json`
- Supports GPT-4o model for fast, smart replies

## 📦 Requirements

- Python 3.8+
- OpenAI Python SDK
- `python-dotenv` for loading API key

Install dependencies:
```bash
pip install -r requirements.txt

## ✅ Current Progress

- [x] Day 1: Project scaffolding + setup
- [x] Day 2: GPT-4o prompt + response pipeline
- [x] Day 3: SQLite logging (logs prompt, response, timestamp)