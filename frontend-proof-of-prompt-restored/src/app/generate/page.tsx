'use client'

import { useState, useEffect } from 'react';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useConnect, useAccount } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import dynamic from 'next/dynamic';

// Dynamically import WalletStatus to avoid SSR issues
const WalletStatus = dynamic(() => import('@/components/WalletStatus'), {
  ssr: false,
  loading: () => <div className="h-6"></div> // Loading placeholder
});

interface ProofResponse {
  prompt: string;
  response: string;
  local_hash: string;
  timestamp: string;
  blockchain: {
    status: string;
    tx_hash?: string;
    explorer_url?: string;
  };
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [proof, setProof] = useState<ProofResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const { isConnected, address } = useAccount();
  const { connect, status: connectStatus } = useConnect({
    onError(error) {
      let message = 'Failed to connect wallet.';
      if (error.name === 'ConnectorNotFoundError') {
        message = 'MetaMask extension not found!';
      } else if (error.name === 'UserRejectedRequestError') {
        message = 'Connection rejected by user.';
      }
      console.error('Connection error:', error);
      setError(message);
    }
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install it to continue.');
    }
  }, [hasMounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      setError('API base URL is not defined. Check your .env.local.');
      console.error('Missing env: NEXT_PUBLIC_API_BASE_URL');
      return;
    }

    setIsLoading(true);
    setProof(null);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'gpt-4o',
          temperature: 0.7,
          wallet_address: address,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Server returned an error');
      }

      const data = await res.json();
      setProof(data);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err?.message || 'Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!proof) return;

    navigator.clipboard.writeText(JSON.stringify(proof, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setError('Failed to copy to clipboard'));
  };

  if (!hasMounted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">✍️ Generate AI Proof</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">✍️ Generate AI Proof</h1>

      {/* Wallet Connection */}
      <div className="mb-4">
        {!isConnected ? (
          <button
            onClick={() => connect({ connector: metaMask() })}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={connectStatus === 'pending'}
          >
            {connectStatus === 'pending' ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        ) : (
          <WalletStatus />
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          className="w-full bg-gray-800 text-white border border-gray-700 rounded p-3 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          required
          disabled={isLoading}
        />

        <button
          type="submit"
          className={`mt-2 px-4 py-2 rounded transition ${
            isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'
          } text-white disabled:opacity-50`}
          disabled={!isConnected || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Processing...
            </span>
          ) : (
            'Generate & Anchor'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900 text-red-100 rounded-md">
          <p className="flex items-center gap-2">
            <span>❌</span> {error}
          </p>
        </div>
      )}

      {proof && (
        <div className="mt-6 p-4 bg-gray-800 rounded-md text-white">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>✅</span> Prompt Verified
            </h2>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-sm bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Proof'}
            </button>
          </div>
          <div className="space-y-2">
            <p><span className="font-medium">Prompt:</span> {proof.prompt}</p>
            <p><span className="font-medium">Response:</span> {proof.response}</p>
            <p>
              <span className="font-medium">Hash:</span>{' '}
              <code className="text-sm bg-gray-900 p-1 rounded break-all">
                {proof.local_hash}
              </code>
            </p>
            <p><span className="font-medium">Timestamp:</span> {proof.timestamp}</p>
          </div>

          {proof.blockchain?.tx_hash ? (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="font-medium">Blockchain Confirmation:</p>
              <a
                className="text-blue-400 hover:text-blue-300 underline break-all"
                href={proof.blockchain.explorer_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction: {proof.blockchain.tx_hash.slice(0, 20)}...
              </a>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-yellow-400 flex items-center gap-2">
                <span>⚠️</span> Blockchain anchor not available
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-xs text-gray-500">
        <p>API Base: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}