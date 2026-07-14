import { ProductDetailView } from '@/features/inventory/product-detail-view';

/**
 * Server component wrapper: Next 16 makes `params` a `Promise` in Server
 * Component page props (must `await`), so the actual detail UI — which
 * needs client hooks (React Query, useState for the edit dialog) — lives in
 * `ProductDetailView` and just receives the resolved `id` as a prop.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailView productId={id} />;
}
