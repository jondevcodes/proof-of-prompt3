import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
    const response = await api.get(`/proofs/${txHash}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw handleApiError(error);
  }
};