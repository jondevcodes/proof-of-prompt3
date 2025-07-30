'use client'

import { useState, useEffect } from 'react';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useConnect, useAccount } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

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

  // Get wallet connection status
  const { isConnected, address } = useAccount();
  const { connect, status: connectStatus } = useConnect();

  // Debug Metamask detection
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
      setError('Metamask is not installed. Please install it to continue.');
      console.error('Metamask is not detected.');
    } else {
      console.log('Metamask detected:', window.ethereum);
    }
  }, []);

  // Handle wallet connection errors
  useEffect(() => {
    if (connectStatus === 'error') {
      setError('Failed to connect wallet. Make sure MetaMask is installed.');
    }
  }, [connectStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require wallet connection
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setProof(null);
    setError(null);

    try {
      // Safely get environment variable
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) throw new Error('API base URL is not defined');

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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setProof(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to process your request');
      console.error('Submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (proof) {
      const json = JSON.stringify(proof, null, 2);
      navigator.clipboard.writeText(json)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
        .catch(() => setError('Failed to copy to clipboard'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">✍️ Generate AI Proof</h1>

      {/* Wallet connection status */}
      <div className="mb-4">
        {!isConnected ? (
          <button
            onClick={() => {
              console.log('Connecting to Metamask...');
              connect({ connector: metaMask() }).catch((err) => {
                console.error('Connection error:', err);
                setError('Failed to connect wallet. Please try again.');
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {connectStatus === 'pending' ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-green-500">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          className="w-full bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none p-3 rounded placeholder-gray-400"
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          required
        />

        <button
          type="submit"
          className={`mt-2 px-4 py-2 rounded transition ${
            isConnected
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 cursor-not-allowed text-gray-300'
          } ${isLoading ? 'opacity-70' : ''}`}
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
            <span className="text-xl">❌</span> {error}
          </p>
        </div>
      )}

      {proof && (
        <div className="mt-6 p-4 bg-gray-800 text-white rounded-md shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
              <span>✅</span> Prompt Verified
            </h2>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-sm bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded"
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

          {proof.blockchain.tx_hash ? (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="font-medium">Blockchain Confirmation:</p>
              <a
                className="text-blue-400 hover:text-blue-300 underline break-all"
                href={proof.blockchain.explorer_url}
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

      {/* Environment debug info (remove in production) */}
      <div className="mt-8 text-xs text-gray-500">
        <p>API Base: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}