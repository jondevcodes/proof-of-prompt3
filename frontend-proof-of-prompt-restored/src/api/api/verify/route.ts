import { NextResponse } from 'next/server';
import axios from 'axios';
import { keccak256, toUtf8Bytes } from 'ethers'; // ✅ ethers v6+ import

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'Invalid prompt. Must be at least 3 characters.' },
        { status: 400 }
      );
    }

    const promptBytes = toUtf8Bytes(prompt);
    const promptHash = keccak256(promptBytes);

    const backendResponse = await axios.post(`${BACKEND_URL}/verify`, {
      prompt,
      hash: promptHash,
    }, { timeout: 5000 });

    return NextResponse.json(backendResponse.data);

  } catch (error) {
    console.error('Verification API error:', error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.detail || 'Backend verification failed' },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
