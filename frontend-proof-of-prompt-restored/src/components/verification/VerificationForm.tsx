import { useState } from 'react';

interface VerificationFormProps {
  onSubmit: (prompt: string, response: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function VerificationForm({ 
  onSubmit, 
  isLoading,
  disabled
}: VerificationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(prompt, response);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Original Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded-md"
          placeholder="Enter the original prompt..."
          disabled={disabled || isLoading}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          AI Response
        </label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={6}
          className="w-full p-2 border rounded-md"
          placeholder="Paste the AI response here..."
          disabled={disabled || isLoading}
          required
        />
      </div>

      <button
        type="submit"
        disabled={disabled || isLoading || !prompt.trim() || !response.trim()}
        className={`w-full py-2 px-4 rounded-md text-white ${
          disabled ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? 'Verifying...' : 'Verify Proof'}
      </button>
    </form>
  );
}