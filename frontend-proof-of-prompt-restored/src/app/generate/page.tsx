'use client'

import { useState } from 'react'

interface ProofResponse {
  prompt: string
  response: string
  local_hash: string
  timestamp: string
  blockchain: {
    status: string
    tx_hash?: string
    explorer_url?: string
  }
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [proof, setProof] = useState<ProofResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setProof(null)
    setError(null)

    try {
      const res = await fetch('http://localhost:8000/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'gpt-4o',
          temperature: 0.7,
        }),
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setProof(data)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">✍️ Generate AI Proof</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full bg-[#111] text-white border border-gray-700 focus:border-blue-500 focus:outline-none p-3 rounded placeholder-gray-400"
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate & Anchor'}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">❌ {error}</p>}

      {proof && (
        <div className="mt-6 p-4 bg-gray-900 text-white rounded shadow">
          <h2 className="text-lg font-bold text-green-400 mb-2">✅ Prompt Verified</h2>
          <p><strong>Prompt:</strong> {proof.prompt}</p>
          <p><strong>Response:</strong> {proof.response}</p>
          <p><strong>Hash:</strong> <code>{proof.local_hash}</code></p>
          <p><strong>Timestamp:</strong> {proof.timestamp}</p>

          {proof.blockchain.tx_hash ? (
            <p>
              <strong>Tx:</strong>{' '}
              <a
                className="underline text-blue-400"
                href={proof.blockchain.explorer_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {proof.blockchain.tx_hash}
              </a>
            </p>
          ) : (
            <p className="text-yellow-400">⚠️ Blockchain anchor not available</p>
          )}
        </div>
      )}
    </div>
  )
}
