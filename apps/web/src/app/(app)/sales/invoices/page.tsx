'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInvoices } from '@/features/sales/hooks';
import { invoiceColumns } from '@/features/sales/components/invoice-columns';
import { InvoiceFilters } from '@/features/sales/components/invoice-filters';
import type { InvoiceStatus } from '@/features/sales/status';

/** Browsable invoice history across every sales order — the order detail page's "Invoice & payments" section covers the single-order workflow (generate/pay); this is the cross-order view. */
export default function InvoicesPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const query = useInvoices({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    status: (status || undefined) as InvoiceStatus | undefined,
  });

  return (
    <>
      <Link href="/sales" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-2 -ml-2')}>
        <ArrowLeftIcon /> Back to Sales
      </Link>

      <PageHeader title="Invoice History" description="Every invoice issued against a sales order, across all distributors." />

      <div className="mt-6 space-y-4">
        <InvoiceFilters status={status} onStatusChange={setStatus} />

        <DataTable
          columns={invoiceColumns}
          data={query.data?.data ?? []}
          rowCount={query.data?.pagination.total ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by invoice number..."
          isLoading={query.isLoading}
          emptyTitle="No invoices"
          emptyDescription="Invoices generated from confirmed sales orders will appear here."
          getRowId={(row) => row.id}
        />
      </div>
    </>
  );
}
