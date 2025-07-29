import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

type VerificationData = {
  on_chain: {
    exists: boolean;
    timestamp?: number;
    error?: string;
  };
  local_record: boolean;
  consistency_check: boolean;
};

export function VerificationResult({ data }: { data: VerificationData }) {
  return (
    <div className="mt-8 space-y-6">
      {/* Local Verification */}
      <div className={`p-4 rounded-lg border ${
        data.local_record ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center gap-2">
          {data.local_record ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-600" />
          )}
          <h3 className="font-medium">Local Database Verification</h3>
        </div>
        <p className="mt-2 text-sm">
          {data.local_record 
            ? "Proof found in local records" 
            : "No matching proof in database"}
        </p>
      </div>

      {/* Blockchain Verification */}
      <div className={`p-4 rounded-lg border ${
        data.on_chain.exists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center gap-2">
          {data.on_chain.exists ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-600" />
          )}
          <h3 className="font-medium">Blockchain Verification</h3>
        </div>
        {data.on_chain.exists ? (
          <p className="mt-2 text-sm">
            Anchored on {new Date(data.on_chain.timestamp! * 1000).toLocaleString()}
          </p>
        ) : (
          <p className="mt-2 text-sm">
            {data.on_chain.error || "Not found on blockchain"}
          </p>
        )}
      </div>
    </div>
  );
}