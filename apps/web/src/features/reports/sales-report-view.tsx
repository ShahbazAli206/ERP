'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DollarSignIcon, ShoppingCartIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { DateRangeFilter } from './date-range-filter';
import { formatMoney, startOfYear, toDateInputValue } from './format';
import { useSalesReport } from './hooks';
import type { SalesReportRow } from './api';

const columns: ColumnDef<SalesReportRow, unknown>[] = [
  { accessorKey: 'orderNumber', header: 'Order #' },
  {
    accessorKey: 'orderDate',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.orderDate).toLocaleDateString(),
  },
  { accessorKey: 'distributorName', header: 'Distributor' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.totalAmount)}</span>,
  },
];

export function SalesReportView() {
  const [from, setFrom] = useState(() => toDateInputValue(startOfYear()));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const params = useMemo(
    () => ({ from, to, page: pagination.pageIndex + 1, pageSize: pagination.pageSize }),
    [from, to, pagination],
  );
  const query = useSalesReport(params);

  return (
    <ReportsPageShell title="Sales Report" description="Sales orders for a date range, with real per-order totals.">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <ReportToolbar kind="sales" params={{ from, to }} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title="Orders"
            value={query.data?.summary.orderCount ?? '—'}
            icon={ShoppingCartIcon}
            isLoading={query.isLoading}
          />
          <StatCard
            title="Grand total"
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
          emptyTitle="No sales orders"
          emptyDescription="No orders fall in the selected date range."
          getRowId={(row) => row.id}
        />
      </div>
    </ReportsPageShell>
  );
}
