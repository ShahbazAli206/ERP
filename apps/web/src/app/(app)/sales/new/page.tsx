'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SoForm } from '@/features/sales/components/so-form';
import { useCreateSalesOrder } from '@/features/sales/hooks';
import type { SalesOrderFormValues } from '@/features/sales/schemas';

export default function NewSalesOrderPage() {
  const router = useRouter();
  const createMutation = useCreateSalesOrder();

  function handleSubmit(values: SalesOrderFormValues) {
    createMutation.mutate(
      {
        distributorId: values.distributorId,
        currency: values.currency,
        discountPercent: Number(values.discountPercent),
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
        })),
      },
      {
        onSuccess: (order) => router.push(`/sales/${order.id}`),
      },
    );
  }

  return (
    <>
      <PageHeader title="Create Sales Order" description="Starts as a draft — confirm it once ready to consume stock." />
      <div className="mt-6 max-w-4xl">
        <SoForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} submitLabel="Create draft" />
      </div>
    </>
  );
}
