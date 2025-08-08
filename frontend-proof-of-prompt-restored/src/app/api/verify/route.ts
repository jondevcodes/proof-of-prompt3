import { NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const { prompt, response } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'Invalid prompt. Must be at least 3 characters.' },
        { status: 400 }
      );
    }

    if (!response || typeof response !== 'string') {
      return NextResponse.json(
        { error: 'Invalid response. Must be a string.' },
        { status: 400 }
      );
    }

    const backendResponse = await axios.post(`${BACKEND_URL}/verify`, {
      prompt,
      response,
    }, { timeout: 10000 });

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
