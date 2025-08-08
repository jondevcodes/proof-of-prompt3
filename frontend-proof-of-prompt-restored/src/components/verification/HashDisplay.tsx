import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface HashDisplayProps {
  hash: string;
}

export default function HashDisplay({ hash }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = hash;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  };

  return (
    <div className="flex items-center gap-2">
      <code className="text-sm bg-gray-900 p-2 rounded break-all text-gray-200 flex-1">
        {hash}
      </code>
      <button
        onClick={copyToClipboard}
        className="flex items-center gap-1 text-sm bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded transition"
      >
        <ClipboardDocumentIcon className="h-4 w-4" />
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}