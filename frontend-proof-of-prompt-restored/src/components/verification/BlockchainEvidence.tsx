import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface BlockchainEvidenceProps {
  txHash: string;
  blockNumber: number;
  chainId: number;
}

export default function BlockchainEvidence({ 
  txHash, 
  blockNumber, 
  chainId 
}: BlockchainEvidenceProps) {
  const getExplorerUrl = () => {
    switch (chainId) {
      case 1: // Mainnet
        return `https://etherscan.io/tx/${txHash}`;
      case 11155111: // Sepolia
        return `https://sepolia.etherscan.io/tx/${txHash}`;
      case 137: // Polygon
        return `https://polygonscan.com/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`;
    }
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="font-medium mb-3 text-gray-300">Blockchain Evidence</h3>
      <div className="space-y-2 text-sm text-gray-200">
        <div className="flex justify-between">
          <span>Transaction Hash:</span>
          <span className="font-mono">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
        </div>
        <div className="flex justify-between">
          <span>Block Number:</span>
          <span>{blockNumber.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Chain ID:</span>
          <span>{chainId}</span>
        </div>
        <div className="pt-2">
          <a
            href={getExplorerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
          >
            View on Explorer
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}