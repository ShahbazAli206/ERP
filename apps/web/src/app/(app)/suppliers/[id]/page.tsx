import { SupplierProfileView } from '@/features/suppliers/supplier-profile-view';

/**
 * Server component wrapper: Next 16 makes `params` a `Promise` in Server
 * Component page props (must `await`), so the actual profile UI — which
 * needs client hooks (React Query, useState for dialogs) — lives in
 * `SupplierProfileView` and just receives the resolved `id` as a prop.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierProfileView supplierId={id} />;
}
