export function ProofMetadata({
  prompt,
  response,
  timestamp,
  model
}: {
  prompt: string;
  response: string;
  timestamp: string;
  model: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-proof-card border border-proof-primary/10">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Prompt</h2>
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="whitespace-pre-wrap">{prompt}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">AI Response</h2>
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Model</h3>
          <p>{model}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
          <p>{new Date(timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}