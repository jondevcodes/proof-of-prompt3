import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';

export default function HashDisplay({ hash }: { hash: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
  };

  return (
    <div className="group relative">
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
        <code className="text-sm font-mono break-all">
          {hash.substring(0, 16)}...{hash.substring(hash.length - 8)}
        </code>
        <button 
          onClick={copyToClipboard}
          className="ml-2 text-gray-400 hover:text-gray-600"
          aria-label="Copy hash"
        >
          <ClipboardDocumentIcon className="h-4 w-4" />
        </button>
      </div>
      <span className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100">
        Content Hash
      </span>
    </div>
  );
}