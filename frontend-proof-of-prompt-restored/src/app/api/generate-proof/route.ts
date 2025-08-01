import { NextResponse } from 'next/server';
import { keccak256, toUtf8Bytes, isAddress, JsonRpcProvider, Wallet, Contract } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const CONTRACT_ABI = ['function anchorHash(bytes32)'];

export async function POST(req: Request) {
  const body = await req.json();
  const { prompt, walletAddress } = body;

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Invalid or missing prompt' }, { status: 400 });
  }

  if (!walletAddress || !isAddress(walletAddress)) {
    return NextResponse.json({ error: 'Invalid or missing wallet address' }, { status: 400 });
  }

  try {
    const RPC_URL = process.env.RPC_URL!;
    const PRIVATE_KEY = process.env.PRIVATE_KEY!;
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

    const provider = new JsonRpcProvider(RPC_URL);
    const wallet = new Wallet(PRIVATE_KEY, provider);
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    const local_hash = keccak256(toUtf8Bytes(prompt));

    // ⛽ Estimate gas
    const gasEstimate = await contract.anchorHash.estimateGas(local_hash);

    // 📝 Send tx
    const tx = await contract.anchorHash(local_hash, {
      gasLimit: gasEstimate,
    });
    const receipt = await tx.wait();

    const blockchain = {
      status: 'confirmed',
      tx_hash: tx.hash,
      block_number: receipt.blockNumber,
      gas_used: receipt.gasUsed.toString(),
      explorer_url: `https://sepolia.etherscan.io/tx/${tx.hash}`,
    };

    const proof = {
      prompt,
      response: `Generated response for: ${prompt}`,
      local_hash,
      timestamp: new Date().toISOString(),
      blockchain,
    };

    return NextResponse.json(proof, { status: 200 });
  } catch (error: any) {
    console.error('❌ Blockchain anchoring failed:', error);
    return NextResponse.json({
      error: 'Blockchain anchoring failed',
      blockchain: {
        status: 'failed',
        tx_hash: null,
        explorer_url: null,
      },
    }, { status: 500 });
  }
}
