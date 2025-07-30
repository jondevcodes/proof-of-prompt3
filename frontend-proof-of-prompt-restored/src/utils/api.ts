import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PROOF_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Centralized error handling
const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    return new Error(error.response?.data?.detail || 'API request failed');
  }
  return new Error('Network error');
};

export const generateProof = async (data: { prompt: string; model?: string; temperature?: number }) => {
  try {
    const response = await api.post('/prompt', data);  // ✅ Use backend’s actual POST route
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const verifyProof = async (data: { prompt: string; response: string }) => {
  try {
    const response = await api.post('/verify', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getProofByTx = async (txHash: string) => {
  try {
    const response = await api.get(`/proof/${txHash}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw handleApiError(error);
  }
};
