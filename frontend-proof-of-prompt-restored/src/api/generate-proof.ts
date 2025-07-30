// filepath: /frontend-proof-of-prompt-restored/src/api/generate-proof.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, walletAddress } = req.body;

  if (!prompt || !walletAddress) {
    return res.status(400).json({ error: 'Missing prompt or wallet address' });
  }

  try {
    // Blockchain interaction (mocked for now)
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const signer = provider.getSigner(walletAddress);

    // Generate proof (mock logic)
    const proof = {
      prompt,
      response: `Generated response for: ${prompt}`,
      local_hash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(prompt)),
      timestamp: new Date().toISOString(),
      blockchain: {
        status: "pending",
        tx_hash: null,
        explorer_url: null,
      },
    };

    res.status(200).json(proof);
  } catch (error) {
    console.error('Error generating proof:', error);
    res.status(500).json({ error: 'Failed to generate proof' });
  }
}