import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-constants';

/**
 * Server-side route gate for protected pages.
 *
 * NOTE for future readers: Next.js 16 renamed the `middleware.ts` file
 * convention to `proxy.ts` (the exported function is now named `proxy`, not
 * `middleware`) — `middleware.ts` still works but is deprecated and prints a
 * warning. This file uses the current convention. See
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
 *
 * This is an "optimistic" check (presence of the session cookie only, not
 * signature/expiry validation — that happens on the API for every request
 * anyway). It exists purely to avoid a flash of protected content / an
 * unnecessary client-side redirect: if there's no cookie, bounce to /login
 * before any page code runs. If the token is present but has actually
 * expired, the first API call made from that page will 401, and the global
 * React Query error handler (`src/lib/query-provider.tsx`) clears the
 * session and redirects — so both the "never logged in" and "session
 * expired" cases are covered, just at different layers.
 */

const PUBLIC_PATHS = ['/login', '/forgot-password'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const publicPath = isPublicPath(pathname);

  if (!hasSession && !publicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && publicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets / Next internals / favicon.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
