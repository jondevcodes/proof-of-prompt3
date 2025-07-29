'use client'
import { useState } from 'react'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'

export default function GeneratePage() {
  // ... [keep all existing state and handlers] ...

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* ... [keep form code unchanged] ... */}

      {/* {proof && (
        <div className="mt-6 p-6 bg-gray-800 rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
              <span>✅</span>
              <span>Proof Generated</span>
            </h2>

            <button
              onClick={() => copyToClipboard(JSON.stringify(proof, null, 2))}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
              <span>Copy All</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-900 rounded">
              <h3 className="font-medium mb-2">Prompt</h3>
              <p className="whitespace-pre-wrap">{proof.prompt}</p>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}
