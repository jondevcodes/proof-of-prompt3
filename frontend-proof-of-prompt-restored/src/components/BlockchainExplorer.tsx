import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export function BlockchainExplorer({
  txHash,
  chainId = 11155111 // Default Sepolia
}: {
  txHash?: string;
  chainId?: number;
}) {
  if (!txHash) return null;

  const explorerUrl = `https://${chainId === 11155111 ? 'sepolia.' : ''}etherscan.io/tx/${txHash}`;

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline flex items-center gap-1"
      >
        <span>View on {chainId === 11155111 ? 'Sepolia Etherscan' : 'Etherscan'}</span>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </a>
      <div className="mt-2">
        <p className="text-xs text-gray-600 break-all">{txHash}</p>
      </div>
    </div>
  );
}