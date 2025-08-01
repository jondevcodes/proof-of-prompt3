import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

// Supported chains mapping for better maintainability
const CHAIN_EXPLORERS = {
  1: {
    name: 'Ethereum',
    url: 'https://etherscan.io/tx/',
  },
  11155111: {
    name: 'Sepolia',
    url: 'https://sepolia.etherscan.io/tx/',
  },
  5: {
    name: 'Goerli',
    url: 'https://goerli.etherscan.io/tx/',
  },
  // Add other chains as needed
  137: {
    name: 'Polygon',
    url: 'https://polygonscan.com/tx/',
  },
  80001: {
    name: 'Mumbai',
    url: 'https://mumbai.polygonscan.com/tx/',
  }
} as const;

type SupportedChainId = keyof typeof CHAIN_EXPLORERS;

interface BlockchainExplorerProps {
  txHash?: string;
  chainId?: SupportedChainId;
  className?: string;
}

export function BlockchainExplorer({
  txHash,
  chainId = 11155111, // Default Sepolia
  className = ''
}: BlockchainExplorerProps) {
  if (!txHash) return null;

  const explorer = CHAIN_EXPLORERS[chainId] || CHAIN_EXPLORERS[11155111]; // Fallback to Sepolia
  const explorerUrl = `${explorer.url}${txHash}`;

  return (
    <div className={`mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 ${className}`}>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline flex items-center gap-1"
        aria-label={`View transaction on ${explorer.name}`}
      >
        <span>View on {explorer.name}</span>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </a>
      <div className="mt-2">
        <p className="text-xs text-gray-600 break-all" title="Transaction hash">
          {txHash}
        </p>
      </div>
    </div>
  );
}