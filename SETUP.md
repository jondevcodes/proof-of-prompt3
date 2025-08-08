# Proof-of-Prompt Setup Guide

## Prerequisites

- Node.js 18+ 
- Python 3.10+
- MetaMask or similar Web3 wallet
- Ethereum Sepolia testnet ETH

## Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

3. **Required environment variables:**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `WEB3_PROVIDER_URL`: Ethereum RPC URL (e.g., Infura Sepolia)
   - `CONTRACT_ADDRESS`: Deployed smart contract address
   - `PRIVATE_KEY`: Wallet private key for transactions
   - `ALLOWED_ORIGINS`: CORS origins (comma-separated)

4. **Start the backend:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend-proof-of-prompt-restored
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env.local
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_CHAIN_ID=11155111
   ```

4. **Start the frontend:**
   ```bash
   npm run dev
   ```

## Smart Contract Deployment

1. **Deploy the ProofAnchor contract to Sepolia testnet**
2. **Update the `CONTRACT_ADDRESS` in your `.env` file**

## Usage

1. **Generate Proof:**
   - Connect your wallet
   - Enter a prompt
   - Click "Generate & Anchor"
   - Wait for blockchain confirmation

2. **Verify Proof:**
   - Enter the original prompt and response
   - Click "Verify Proof"
   - Check blockchain verification status

## Troubleshooting

### Common Issues:

1. **Blockchain connection failed:**
   - Check your RPC URL
   - Ensure you have Sepolia testnet ETH
   - Verify contract address is correct

2. **CORS errors:**
   - Update `ALLOWED_ORIGINS` in backend `.env`
   - Ensure frontend URL is included

3. **API errors:**
   - Check backend is running on port 8000
   - Verify environment variables are set
   - Check OpenAI API key is valid

### Development Tips:

- Use browser dev tools to check network requests
- Check backend logs for detailed error messages
- Test blockchain functions separately using the test scripts

## Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive data
- Test thoroughly on testnet before mainnet
- Implement proper rate limiting in production
