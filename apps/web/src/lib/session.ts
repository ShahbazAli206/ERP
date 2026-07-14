/**
 * Session persistence.
 *
 * ── Approach & rationale ────────────────────────────────────────────────
 * The API returns the JWT in the JSON response body (`POST /api/auth/login`),
 * not via `Set-Cookie` — so the frontend sets its own cookie after a
 * successful login. We use a plain (non-httpOnly) cookie, readable by both
 * client-side JS (to attach `Authorization: Bearer <token>` on API calls)
 * and by `src/proxy.ts` (Next's server-side request gate, so protected
 * routes redirect to /login with no flash of protected content).
 *
 * A plain cookie is a deliberate tradeoff for this demo: an httpOnly cookie
 * would be more secure against XSS token theft, but would require every API
 * call to be proxied through a Next.js Route Handler (so the httpOnly
 * cookie could be read server-side and re-attached as a header) instead of
 * calling `NEXT_PUBLIC_API_URL` directly from the browser. That's a
 * reasonable choice for a production app; for this demo we accept the XSS
 * exposure tradeoff in exchange for a much simpler client -> API path.
 *
 * The cookie's `max-age` is derived from the login response's `expiresIn`
 * (e.g. "8h", matching the JWT's own expiry from `apps/api/.env` -
 * `JWT_EXPIRES_IN`), so the cookie and the token expire together. If the
 * token expires before the cookie does for any reason, API calls will start
 * returning 401s, which `src/lib/query-provider.tsx`'s global query-error
 * handler catches to clear the session and redirect to /login.
 *
 * Only the token is persisted client-side — the user profile (name, role,
 * permissions) is re-fetched from `GET /api/auth/me` on load via React
 * Query (see `src/features/auth/use-auth.tsx`) rather than duplicated into
 * a second cookie.
 * ────────────────────────────────────────────────────────────────────────
 */

import { SESSION_COOKIE_NAME } from './session-constants';

export { SESSION_COOKIE_NAME };

/** Fallback if `expiresIn` ever fails to parse (matches the API's default). */
const DEFAULT_MAX_AGE_SECONDS = 8 * 60 * 60;

/**
 * Parses a JWT-style duration string ("8h", "30m", "1d", "45s") or a bare
 * number of seconds into a seconds count for the cookie's `max-age`.
 */
export function parseExpiresInToSeconds(expiresIn: string): number {
  const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(expiresIn.trim());
  if (!match) return DEFAULT_MAX_AGE_SECONDS;

  const value = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  const multiplier = { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 }[unit] ?? 1;
  return value * multiplier;
}

function isBrowser() {
  return typeof document !== 'undefined';
}

/** Sets the session cookie after a successful login. Client-side only. */
export function setSessionToken(token: string, expiresIn: string) {
  if (!isBrowser()) return;
  const maxAge = parseExpiresInToSeconds(expiresIn);
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
}

/** Clears the session cookie (logout, or a 401 from an expired token). */
export function clearSessionToken() {
  if (!isBrowser()) return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

/** Reads the current session token for attaching to API requests. */
export function getSessionToken(): string | null {
  if (!isBrowser()) return null;
  const match = new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`).exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}
