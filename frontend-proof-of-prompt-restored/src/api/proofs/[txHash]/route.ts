import { NextResponse } from 'next/server';
import { getProofByTx as getProofByTxBackend } from '@/lib/backend';

export async function GET(
  request: Request,
  { params }: { params: { txHash: string } }
) {
  try {
    const proof = await getProofByTxBackend(params.txHash);
    if (!proof) {
      return NextResponse.json(
        { error: 'Proof not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(proof);
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}