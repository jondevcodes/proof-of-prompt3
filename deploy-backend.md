# Backend Deployment Instructions

## Option 1: Render (Recommended - Free)

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** proof-of-prompt-backend
   - **Environment:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

6. Add Environment Variables:
   - `OPENAI_API_KEY`: your_openai_api_key
   - `WEB3_PROVIDER_URL`: https://sepolia.infura.io/v3/758ba43ab1b448de9d6dd0a2449f320c
   - `CONTRACT_ADDRESS`: 0xc01026685E93C4E63480865D3B011FF54e655720
   - `PRIVATE_KEY`: your_private_key
   - `MAX_PRIORITY_FEE_PER_GAS`: 2
   - `ALLOWED_ORIGINS`: https://frontend-proof-of-prompt-restored-88sayy96i.vercel.app

7. Deploy and get your backend URL (e.g., https://proof-of-prompt-backend.onrender.com)

## Option 2: Railway

1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables (same as above)
6. Deploy and get your backend URL

## Update Frontend

After deploying the backend, update the frontend environment:

```bash
cd frontend-proof-of-prompt-restored
echo "NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com" > .env.local
vercel --prod
```

## Quick Fix for Now

For immediate testing, you can use your local backend by:

1. Make sure your backend is running: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
2. Use ngrok to expose it: `ngrok http 8000`
3. Update frontend with the ngrok URL
