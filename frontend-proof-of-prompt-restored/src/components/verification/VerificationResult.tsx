import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import HashDisplay from './HashDisplay';
import BlockchainEvidence from './BlockchainEvidence';

interface VerificationData {
  verified: boolean;
  hash?: string;
  error?: string;
  blockchain?: {
    tx_hash: string;
    block_number: number;
    chain_id: number;
  };
}

export default function VerificationResult({ data }: { data: VerificationData }) {
  if (data.error) {
    return (
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-600">
          <XCircleIcon className="h-5 w-5 mr-2" />
          <h3 className="font-medium">Verification Failed</h3>
        </div>
        <p className="mt-2 text-sm">{data.error}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className={`p-4 rounded-lg border ${
        data.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          {data.verified ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-600" />
          )}
          <h3 className="font-medium">
            {data.verified ? 'Verification Successful' : 'Proof Invalid'}
          </h3>
        </div>
        
        {data.hash && (
          <div className="mt-4">
            <HashDisplay hash={data.hash} />
          </div>
        )}
      </div>

      {data.blockchain && (
        <BlockchainEvidence 
          txHash={data.blockchain.tx_hash}
          blockNumber={data.blockchain.block_number}
          chainId={data.blockchain.chain_id}
        />
      )}
    </div>
  );
}