// src/lib/backend.ts

export async function getProofByTx(txHash: string) {
  const response = await fetch(`http://localhost:8000/api/proofs/${txHash}`);
  if (!response.ok) {
    throw new Error('Failed to fetch proof');
  }
  return await response.json();
}
