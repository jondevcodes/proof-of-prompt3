# Dockerfile (optimized for FastAPI + Web3)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Web3/crypto
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create persistent data directory for SQLite
RUN mkdir -p /data

# Set production-ready defaults
ENV PORT=8080
ENV DATABASE_URL=sqlite:////data/proofs.db
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Run with gunicorn for production
CMD ["gunicorn", "main:app", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8080", "--timeout", "120"]