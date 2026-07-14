'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { formatMoney } from './format';
import { useDistributorReport } from './hooks';
import type { DistributorReportRow } from './api';

const columns: ColumnDef<DistributorReportRow, unknown>[] = [
  { accessorKey: 'name', header: 'Distributor' },
  { accessorKey: 'region', header: 'Region' },
  { accessorKey: 'pricingGroupName', header: 'Pricing group', cell: ({ row }) => row.original.pricingGroupName ?? '—' },
  {
    accessorKey: 'totalCommittedSalesValue',
    header: 'Committed sales value',
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.totalCommittedSalesValue)}</span>,
  },
  {
    accessorKey: 'outstandingBalance',
    header: 'Outstanding balance',
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.outstandingBalance)}</span>,
  },
  { accessorKey: 'salesOrderCount', header: 'Order count' },
];

/** Full listing, not paginated server-side — sliced client-side to feed `DataTable`. */
export function DistributorReportView() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const query = useDistributorReport();

  const rows = query.data ?? [];
  const start = pagination.pageIndex * pagination.pageSize;
  const pageRows = rows.slice(start, start + pagination.pageSize);

  return (
    <ReportsPageShell title="Distributor Report" description="Every distributor's committed sales value and outstanding balance.">
      <div className="space-y-4">
        <div className="flex justify-end">
          <ReportToolbar kind="distributors" params={{}} />
        </div>
        <DataTable
          columns={columns}
          data={pageRows}
          rowCount={rows.length}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={query.isLoading}
          emptyTitle="No distributors"
          emptyDescription="No distributors found."
          getRowId={(row) => row.distributorId}
        />
      </div>
    </ReportsPageShell>
  );
}
