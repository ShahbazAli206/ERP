'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { PoForm } from '@/features/procurement/components/po-form';
import { useCreatePurchaseOrder } from '@/features/procurement/hooks';
import type { PurchaseOrderFormValues } from '@/features/procurement/schemas';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const createMutation = useCreatePurchaseOrder();

  function handleSubmit(values: PurchaseOrderFormValues) {
    createMutation.mutate(
      {
        supplierId: values.supplierId,
        currency: values.currency,
        exchangeRateToBase: Number(values.exchangeRateToBase),
        expectedArrival: values.expectedArrival ? new Date(values.expectedArrival).toISOString() : undefined,
        notes: values.notes || undefined,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      },
      {
        onSuccess: (po) => router.push(`/procurement/${po.id}`),
      },
    );
  }

  return (
    <>
      <PageHeader title="Create Purchase Order" description="Starts as a draft — submit it for approval when ready." />
      <div className="mt-6 max-w-4xl">
        <PoForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create draft"
        />
      </div>
    </>
  );
}
