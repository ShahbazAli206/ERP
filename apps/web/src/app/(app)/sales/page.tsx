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
import { useSalesOrders } from '@/features/sales/hooks';
import { soColumns } from '@/features/sales/components/so-columns';
import { SoFilters } from '@/features/sales/components/so-filters';
import type { SalesOrderStatus } from '@/features/sales/status';

export default function SalesPage() {
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const query = useSalesOrders({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    status: (status || undefined) as SalesOrderStatus | undefined,
    distributorId: distributorId || undefined,
  });

  return (
    <>
      <PageHeader
        title="Sales"
        description="Sales orders, invoices, returns, and credit notes."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/sales/invoices" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Invoice history
            </Link>
            <Link href="/sales/returns" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Returns &amp; credit notes
            </Link>
            {hasPermission('sales:create') && (
              <Link href="/sales/new" className={cn(buttonVariants({ size: 'sm' }))}>
                <PlusIcon /> Create Order
              </Link>
            )}
          </div>
        }
      />

      <div className="mt-6 space-y-4">
        <SoFilters
          status={status}
          onStatusChange={setStatus}
          distributorId={distributorId}
          onDistributorChange={setDistributorId}
        />

        <DataTable
          columns={soColumns}
          data={query.data?.data ?? []}
          rowCount={query.data?.pagination.total ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by order number..."
          isLoading={query.isLoading}
          emptyTitle="No sales orders"
          emptyDescription="Try adjusting your filters, or create a new sales order."
          getRowId={(row) => row.id}
        />
      </div>
    </>
  );
}
