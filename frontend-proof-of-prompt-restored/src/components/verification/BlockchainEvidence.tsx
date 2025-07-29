import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const getExplorerUrl = (chainId: number, txHash: string) => {
  const subdomain = chainId === 1 ? '' : 
                   chainId === 11155111 ? 'sepolia.' : 
                   chainId === 137 ? 'polygon.' : '';
  return `https://${subdomain}etherscan.io/tx/${txHash}`;
};

export default function BlockchainEvidence({
  txHash,
  blockNumber,
  chainId
}: {
  txHash: string;
  blockNumber: number;
  chainId: number;
}) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-medium text-blue-800 mb-2">Blockchain Evidence</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Transaction</p>
          <Link 
            href={getExplorerUrl(chainId, txHash)}
            target="_blank"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>{txHash.substring(0, 12)}...{txHash.substring(txHash.length - 4)}</span>
            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
          </Link>
        </div>
        
        <div>
          <p className="text-gray-600">Block</p>
          <p>{blockNumber.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}