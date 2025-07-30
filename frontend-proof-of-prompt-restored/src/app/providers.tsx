'use client'

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/wagmi/config'; // Ensure this path is correct
import { ReactNode } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional: For debugging React Query
import { ErrorBoundary } from 'react-error-boundary';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry failed queries twice
      refetchOnWindowFocus: false, // Prevent refetching on window focus
    },
  },
});

// Fallback UI for Error Boundary
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" style={{ padding: '1rem', backgroundColor: '#ffe4e6', color: '#b91c1c' }}>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
    </div>
  );
}

// Providers Component
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
          {/* Optional: React Query Devtools for debugging */}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}