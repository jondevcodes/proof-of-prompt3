import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Centralized error handling
const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.detail || error.response?.data?.error || 'API request failed';
    return new Error(message);
  }
  return new Error('Network error');
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
    const response = await api.get(`/api/proofs/${txHash}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw handleApiError(error);
  }
};

export const generateProof = async (data: { 
  prompt: string; 
  model?: string; 
  temperature?: number;
  wallet_address?: string;
}) => {
  try {
    const response = await api.post('/prompt', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};