'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, type AuthUser } from './api';
import { clearSessionToken } from '@/lib/session';

/** React Query key for the current user profile — reused by anything that needs to invalidate/read it. */
export const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const;

interface AuthContextValue {
  user: AuthUser | undefined;
  isLoading: boolean;
  isError: boolean;
  /** True once we have a definite non-loading answer (either a user or a confirmed auth failure). */
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Mounted once in `app/(app)/layout.tsx` (the protected shell), NOT in the
 * root layout — public pages (/login, /forgot-password) have no session yet
 * and don't need this. Fetches `GET /api/auth/me` so the sidebar/top nav can
 * render the user's name/role/permissions; `src/proxy.ts` already guarantees
 * we only reach this layout with a session cookie present.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: () => authApi.me(),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Stateless JWT demo — logout is best-effort server-side; always clear locally regardless.
    }
    clearSessionToken();
    queryClient.clear();
    router.replace('/login');
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      hasPermission: (permission: string) => query.data?.permissions.includes(permission) ?? false,
      logout,
    }),
    [query.data, query.isLoading, query.isError, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider (i.e. inside app/(app)/layout.tsx)');
  return ctx;
}
