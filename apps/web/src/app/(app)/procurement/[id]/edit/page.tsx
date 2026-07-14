'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { TriangleAlertIcon } from 'lucide-react';
import { usePurchaseOrder, useUpdatePurchaseOrder } from '@/features/procurement/hooks';
import { PoForm } from '@/features/procurement/components/po-form';
import type { PurchaseOrderFormValues } from '@/features/procurement/schemas';

export default function EditPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const query = usePurchaseOrder(id);
  const updateMutation = useUpdatePurchaseOrder(id);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Empty className="min-h-[50vh] flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Purchase order not found</EmptyTitle>
        </EmptyHeader>
        <Link href="/procurement" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Back to Procurement
        </Link>
      </Empty>
    );
  }

  const po = query.data;

  if (po.status !== 'DRAFT') {
    return (
      <Empty className="min-h-[50vh] flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>This purchase order can no longer be edited</EmptyTitle>
          <EmptyDescription>Only draft purchase orders can be edited — {po.poNumber} is now {po.status.replace('_', ' ').toLowerCase()}.</EmptyDescription>
        </EmptyHeader>
        <Link href={`/procurement/${po.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          View purchase order
        </Link>
      </Empty>
    );
  }

  function handleSubmit(values: PurchaseOrderFormValues) {
    updateMutation.mutate(
      {
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
        onSuccess: () => router.push(`/procurement/${id}`),
      },
    );
  }

  return (
    <>
      <PageHeader title={`Edit ${po.poNumber}`} description="Only draft purchase orders can be edited." />
      <div className="mt-6 max-w-4xl">
        <PoForm
          mode="edit"
          purchaseOrder={po}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Save changes"
        />
      </div>
    </>
  );
}
