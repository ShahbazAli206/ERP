'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/use-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePurchaseOrders } from '@/features/procurement/hooks';
import { poColumns } from '@/features/procurement/components/po-columns';
import { PoFilters } from '@/features/procurement/components/po-filters';
import type { PurchaseOrderStatus } from '@/features/procurement/status';

export default function ProcurementPage() {
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const query = usePurchaseOrders({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    status: (status || undefined) as PurchaseOrderStatus | undefined,
    supplierId: supplierId || undefined,
  });

  return (
    <>
      <PageHeader
        title="Procurement"
        description="Purchase orders and the approval workflow."
        actions={
          hasPermission('procurement:create') ? (
            <Link href="/procurement/new" className={cn(buttonVariants({ size: 'sm' }))}>
              <PlusIcon /> Create PO
            </Link>
          ) : undefined
        }
      />

      <div className="mt-6 space-y-4">
        <PoFilters status={status} onStatusChange={setStatus} supplierId={supplierId} onSupplierChange={setSupplierId} />

        <DataTable
          columns={poColumns}
          data={query.data?.data ?? []}
          rowCount={query.data?.pagination.total ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by PO number..."
          isLoading={query.isLoading}
          emptyTitle="No purchase orders"
          emptyDescription="Try adjusting your filters, or create a new purchase order."
          getRowId={(row) => row.id}
        />
      </div>
    </>
  );
}
