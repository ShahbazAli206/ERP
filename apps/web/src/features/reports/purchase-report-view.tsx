'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DollarSignIcon, PackageIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { DateRangeFilter } from './date-range-filter';
import { formatMoney, startOfYear, toDateInputValue } from './format';
import { usePurchaseReport } from './hooks';
import type { PurchaseReportRow } from './api';

const columns: ColumnDef<PurchaseReportRow, unknown>[] = [
  { accessorKey: 'poNumber', header: 'PO #' },
  {
    accessorKey: 'orderDate',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.orderDate).toLocaleDateString(),
  },
  { accessorKey: 'supplierName', header: 'Supplier' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total (native)',
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.currency} {formatMoney(row.original.totalAmount)}
      </span>
    ),
  },
  {
    accessorKey: 'totalAmountBase',
    header: 'Total (base)',
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.totalAmountBase)}</span>,
  },
];

export function PurchaseReportView() {
  const [from, setFrom] = useState(() => toDateInputValue(startOfYear()));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const params = useMemo(
    () => ({ from, to, page: pagination.pageIndex + 1, pageSize: pagination.pageSize }),
    [from, to, pagination],
  );
  const query = usePurchaseReport(params);

  return (
    <ReportsPageShell
      title="Purchase Report"
      description="Purchase orders for a date range. Grand total is converted to base currency since suppliers may bill in different currencies."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <ReportToolbar kind="purchases" params={{ from, to }} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title="Purchase orders"
            value={query.data?.summary.orderCount ?? '—'}
            icon={PackageIcon}
            isLoading={query.isLoading}
          />
          <StatCard
            title="Grand total (base currency)"
            value={query.data ? formatMoney(query.data.summary.grandTotal) : '—'}
            icon={DollarSignIcon}
            isLoading={query.isLoading}
          />
        </div>

        <DataTable
          columns={columns}
          data={query.data?.rows ?? []}
          rowCount={query.data?.summary.orderCount ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={query.isLoading}
          emptyTitle="No purchase orders"
          emptyDescription="No orders fall in the selected date range."
          getRowId={(row) => row.id}
        />
      </div>
    </ReportsPageShell>
  );
}
