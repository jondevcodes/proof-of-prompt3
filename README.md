# 🧠 Proof-of-Prompt

A simple command-line Python app that sends prompts to GPT-4o and logs the responses with timestamps into a local SQLite database. Built for fast iteration, prompt engineering, and tracking your conversations with AI.

---

## 🚀 Features

- 💬 CLI-based interaction with OpenAI GPT-4o
- 🔐 Loads API keys securely using `.env`
- 🧠 Logs prompts, responses, and timestamps to SQLite (`logs.db`)
- 🗂️ JSON logging available (if desired)
- ⚡ FastAPI-compatible backend included for web deployment (optional)

---

## 📦 Tech Stack

- Python 3.10+
- OpenAI API (`openai`)
- `python-dotenv`
- SQLite3
- (Optional) FastAPI + Uvicorn

---

## ✅ Project Progress

- [x] Day 1: Project scaffolding + environment setup
- [x] Day 2: Prompt → GPT-4o → Response pipeline
- [x] Day 3: SQLite logging system with timestamping
- [x] Day 4: FastAPI web backend (optional)
- [ ] Day 5–7: Polish, testing, GitHub README + future roadmap

---

## 🧪 How to Run

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/proof-of-prompt.git
   cd proof-of-prompt
