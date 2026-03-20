'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from './auth';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { RealtimeSync } from './realtime-sync';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RealtimeSync />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
