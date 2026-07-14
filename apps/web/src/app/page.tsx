import { redirect } from "next/navigation";

/**
 * `src/proxy.ts` already redirects unauthenticated requests to `/login`
 * before this ever renders, so reaching this page means a session cookie is
 * present — always forward to the dashboard.
 */
export default function RootPage() {
  redirect("/dashboard");
}
