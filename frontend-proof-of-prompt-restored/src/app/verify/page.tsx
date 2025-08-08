'use client'

import { useState } from 'react'
import { ClipboardDocumentIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { verifyProof } from '@/utils/api'
import { hashRawContent, verifyHash } from '@/utils/proof'

interface VerificationResult {
  verified: boolean
  hash?: string
  error?: string
  blockchain?: {
    tx_hash: string
    block_number: number
    chain_id: number
  }
}

export default function VerifyPage() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim() || !response.trim()) {
      setError('Please enter both prompt and response')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // First verify locally
      const localHash = hashRawContent(prompt, response)
      
      // Then verify on blockchain
      const blockchainResult = await verifyProof({ prompt, response })
      
      setResult({
        verified: blockchainResult.verified,
        hash: localHash,
        blockchain: blockchainResult.blockchain
      })
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => setError('Failed to copy to clipboard'))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔍 Verify AI Proof</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Original Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full p-3 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-blue-500 focus:outline-none"
            placeholder="Enter the original prompt..."
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            AI Response
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={6}
            className="w-full p-3 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-blue-500 focus:outline-none"
            placeholder="Paste the AI response here..."
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim() || !response.trim()}
          className={`w-full py-2 px-4 rounded-md text-white transition ${
            isLoading || !prompt.trim() || !response.trim()
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Verifying...
            </span>
          ) : (
            'Verify Proof'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900 text-red-100 rounded-md flex items-start gap-2">
          <ExclamationCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-gray-800 rounded-lg">
          {/* Result Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              {result.verified ? (
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              ) : (
                <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
              )}
              <h2 className="text-xl font-bold">
                {result.verified ? 'Proof Verified' : 'Proof Invalid'}
              </h2>
            </div>
            
            <button
              onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
              <span>{copied ? 'Copied!' : 'Copy Result'}</span>
            </button>
          </div>

          {/* Result Details */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-900 rounded">
              <h3 className="font-medium mb-2 text-gray-300">Hash</h3>
              <code className="text-sm break-all text-gray-200">
                {result.hash}
              </code>
            </div>
            
            {result.blockchain && (
              <div className="p-4 bg-gray-900 rounded">
                <h3 className="font-medium mb-2 text-gray-300">Blockchain Verification</h3>
                <div className="space-y-1 text-sm text-gray-200">
                  <p>Transaction: {result.blockchain.tx_hash}</p>
                  <p>Block: {result.blockchain.block_number}</p>
                  <p>Chain ID: {result.blockchain.chain_id}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}