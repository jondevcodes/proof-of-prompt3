
---

````markdown
# 🧠 Proof-of-Prompt

> **Prove authorship of AI-generated content** with cryptographic timestamps.  
> The foundation for on-chain prompt verification and AI content rights management.

[![Proof-of-Prompt Demo](https://img.shields.io/badge/DEMO-LIVE-green?style=for-the-badge)](https://youtube.com/shorts/your-demo-link)

---

## 🚀 Features

- 💬 CLI-based + Web API interaction with GPT-4  
- 🔐 Secure API key loading via `.env`  
- 🧠 Logs prompt, response, and timestamp to SQLite (`logs.db`)  
- ✅ **Verification Endpoint** – Instantly confirm prompt authorship  
- 🔐 **SHA-256 Hashing** – Cryptographic proof of prompt integrity  
- 🔗 **Web3-Ready Architecture** – Built for blockchain integration  
- ⚡ FastAPI server for RESTful GPT access  
- 🧪 Auto-generated docs at `/docs`

---

## 📦 Tech Stack

- Python 3.10+  
- `openai`  
- `fastapi` + `uvicorn`  
- `sqlite3`  
- `hashlib` – cryptographic hashing  
- `python-dotenv`  
- `pydantic` – data validation  
- `alembic` *(recommended for future migrations)*

---

## ✅ Development Progress

- ✅ **Day 1:** Project setup + `.env` config  
- ✅ **Day 2:** Prompt/response pipeline  
- ✅ **Day 3:** SQLite logging  
- ✅ **Day 4:** FastAPI backend  
- ✅ **Day 5:** Cryptographic hashing implementation  
- ✅ **Day 6:** Verification endpoint + Swagger UI  
- ✅ **Day 7:** GitHub SSH + repo hardening  
- 🔜 **Phase 2:** Smart contract integration (on-chain proof)

---

## 🧪 How to Run Locally

### 1. Clone the Repo
```bash
git clone git@github.com:jondevcodes/proof-of-prompt-restored.git
cd proof-of-prompt-restored
````

### 2. Optional: Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Create `.env` File

```env
OPENAI_API_KEY=your-openai-key-here
```

> ⚠️ **Never commit this file!** It’s ignored via `.gitignore`.

### 5. Start API Server

```bash
uvicorn main:app --reload
```

📡 Visit: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🔍 Verification Demo

**Verify a prompt hash:**

```bash
curl -X POST http://127.0.0.1:8000/verify \
  -H "Content-Type: application/json" \
  -d '{"hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"}'
```

---

## 🛠️ Future Roadmap

### 🟢 Short Term (1 week)

* Smart contract prototype (Solidity)
* Wallet authentication

### 🟡 Mid Term (1 month)

* IPFS or Arweave storage
* Polygon chain deployment
* NFT “proof-of-prompt” badge generator

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch

   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes

   ```bash
   git commit -m "Add amazing feature"
   ```
4. Push and open a PR

   ```bash
   git push origin feature/amazing-feature
   ```

---

## 🧠 Architecture

```mermaid
graph TD
    A[User] --> B[CLI or Web UI]
    B --> C[FastAPI Server]
    C --> D[GPT-4 API]
    C --> E[SQLite DB]
    E --> F[SHA-256 Hasher]
    F --> G[Verification Endpoint]
    G --> H[Blockchain or IPFS (Planned)]
```

---

## 🔗 Inspired By

* **DeepSeek’s ChainGPT Tracker strategy**
* **Tech With Tim’s Developer Roadmap**
* **Your daily commitment to shipping progress** 🚀

---

## 📜 License

MIT – Free to use, build on, and fork. Attribution appreciated.

```

---
