import { DistributorProfileView } from '@/features/distributors/distributor-profile-view';

/**
 * Server component wrapper: Next 16 makes `params` a `Promise` in Server
 * Component page props (must `await`), so the actual profile UI — which
 * needs client hooks (React Query, useState for dialogs) — lives in
 * `DistributorProfileView` and just receives the resolved `id` as a prop.
 * Mirrors `app/(app)/suppliers/[id]/page.tsx`.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DistributorProfileView distributorId={id} />;
}
