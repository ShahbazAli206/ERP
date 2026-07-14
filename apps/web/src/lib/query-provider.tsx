'use client';

import { useState } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useRouter } from 'next/navigation';
import { ApiError } from './api-client';
import { clearSessionToken } from './session';

/**
 * App-wide React Query defaults. Every module reuses this single
 * `QueryClient` (provided once here in the root layout) — do not create
 * per-module clients.
 *
 * - `staleTime: 30s` — admin/back-office data doesn't need to be
 *   millisecond-fresh; this avoids refetch storms when switching between
 *   tabs/pages that both query the same resource.
 * - `retry` — never retries auth/permission/not-found failures (401/403/404
 *   are deterministic, retrying just delays the error reaching the user);
 *   retries other failures (network blips, 500s) up to twice.
 * - `refetchOnWindowFocus: false` — this is a desktop admin tool, not a
 *   feed; users switching back from another window/tab shouldn't trigger
 *   surprise refetches/loading flickers.
 * - Global `onError` on the QueryCache: any 401 (expired/invalid token)
 *   clears the session cookie and bounces to /login, from anywhere in the
 *   app, without every module having to handle it individually.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
    return false;
  }
  return failureCount < 2;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: shouldRetry,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
              clearSessionToken();
              router.replace('/login');
            }
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
