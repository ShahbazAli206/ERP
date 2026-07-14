import { JournalEntryDetailView } from '@/features/finance/journal-entry-detail-view';

/**
 * Server component wrapper: Next 16 makes `params` a `Promise` in Server
 * Component page props (must `await`), so the actual detail UI — which needs
 * client hooks (React Query) — lives in `JournalEntryDetailView` and just
 * receives the resolved `id` as a prop. Mirrors
 * `app/(app)/inventory/products/[id]/page.tsx`.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JournalEntryDetailView id={id} />;
}
