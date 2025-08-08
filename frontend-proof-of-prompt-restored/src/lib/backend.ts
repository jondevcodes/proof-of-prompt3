// src/lib/backend.ts

export async function getProofByTx(txHash: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/api/proofs/${txHash}`);
  if (!response.ok) {
    throw new Error('Failed to fetch proof');
  }
  return await response.json();
}
