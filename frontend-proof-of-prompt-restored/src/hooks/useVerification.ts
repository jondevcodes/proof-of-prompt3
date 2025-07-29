import { useState } from 'react';
import { verifyProof } from '@/utils/api';

interface VerificationResult {
  verified: boolean;
  hash?: string;
  error?: string;
  blockchain?: {
    tx_hash: string;
    block_number: number;
    chain_id: number;
  };
}

export default function useVerification() {
  const [state, setState] = useState<{
    result: VerificationResult | null;
    loading: boolean;
    error: string | null;
  }>({
    result: null,
    loading: false,
    error: null
  });

  const verify = async (data: { prompt: string; response: string }) => {
    setState({
      result: null,
      loading: true,
      error: null
    });

    try {
      const result = await verifyProof(data);
      setState({
        result,
        loading: false,
        error: null
      });
    } catch (err: any) {
      setState({
        result: null,
        loading: false,
        error: err.message || 'Verification failed'
      });
    }
  };

  const reset = () => {
    setState({
      result: null,
      loading: false,
      error: null
    });
  };

  return {
    verify,
    reset,
    ...state
  };
}