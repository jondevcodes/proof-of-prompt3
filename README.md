# 🧠 Proof-of-Prompt

A simple command-line and web-based Python app that sends prompts to GPT-4 and logs responses with timestamps into a local SQLite database. Built for fast iteration, prompt engineering, and tracking your conversations with AI.

---

## 🚀 Features

- 💬 CLI-based + Web API interaction with GPT-4  
- 🔐 Secure API key loading via `.env`  
- 🧠 Logs prompt, response, and timestamp to SQLite (`logs.db`)  
- ⚡ FastAPI server for RESTful access to GPT  
- 🧪 JSON testing interface at `/docs`  
- 🖥️ Production-ready project structure  

---

## 📦 Tech Stack

- Python 3.10+  
- OpenAI API (`openai`)  
- `python-dotenv`  
- SQLite3  
- FastAPI + Uvicorn  

---

## ✅ Project Progress

- [x] Day 1: Project scaffolding + environment setup  
- [x] Day 2: GPT prompt → response pipeline  
- [x] Day 3: SQLite logging  
- [x] Day 4: FastAPI backend  
- [x] Day 5–7: Tested 3 prompts, committed to GitHub  
- [ ] Final polish + Web3 phase  

---

## 🧪 How to Run Locally

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/proof-of-prompt.git
cd proof-of-prompt
````

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Add API Key to `.env`

```
OPENAI_API_KEY=your-openai-key-here
```

### 4. Start API Server

```bash
uvicorn main:app --reload
```

Then visit: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) to test endpoints.

---

## 🛠️ Future Ideas

* Export logs to `.csv` or JSON
* Turn prompts into NFTs (Proof-of-Ownership)
* Add frontend (Next.js or React)
* Add Auth (API key or wallet sign-in)
* Deploy to Render / Vercel

---

## 🔗 Inspired by

* DeepSeek’s “ChainGPT Tracker” strategy
* Tech With Tim's Dev Roadmap
* Your commitment to shipping daily progress 🚀

```

---