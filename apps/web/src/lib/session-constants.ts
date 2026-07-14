/**
 * The cookie name is split into its own zero-dependency module so it can be
 * imported both by `src/lib/session.ts` (browser-only cookie read/write
 * helpers, used by client components and the API client) and by
 * `src/proxy.ts` (the server-side request gate, which reads the raw
 * `NextRequest` cookie jar and must not pull in any browser-only code).
 */
export const SESSION_COOKIE_NAME = 'erp_token';
