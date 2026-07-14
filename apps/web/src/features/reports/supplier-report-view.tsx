'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { formatMoney } from './format';
import { useSupplierReport } from './hooks';
import type { SupplierReportRow } from './api';

const columns: ColumnDef<SupplierReportRow, unknown>[] = [
  { accessorKey: 'name', header: 'Supplier' },
  { accessorKey: 'country', header: 'Country' },
  { accessorKey: 'currency', header: 'Currency' },
  {
    accessorKey: 'totalCommittedPurchaseValue',
    header: 'Committed purchase value',
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.totalCommittedPurchaseValue)}</span>,
  },
  {
    accessorKey: 'outstandingBalance',
    header: 'Outstanding balance',
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.outstandingBalance)}</span>,
  },
  { accessorKey: 'purchaseOrderCount', header: 'PO count' },
];

/** Full listing, not paginated server-side — sliced client-side to feed `DataTable`. */
export function SupplierReportView() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const query = useSupplierReport();

  const rows = query.data ?? [];
  const start = pagination.pageIndex * pagination.pageSize;
  const pageRows = rows.slice(start, start + pagination.pageSize);

  return (
    <ReportsPageShell title="Supplier Report" description="Every supplier's committed purchase value and outstanding balance.">
      <div className="space-y-4">
        <div className="flex justify-end">
          <ReportToolbar kind="suppliers" params={{}} />
        </div>
        <DataTable
          columns={columns}
          data={pageRows}
          rowCount={rows.length}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={query.isLoading}
          emptyTitle="No suppliers"
          emptyDescription="No suppliers found."
          getRowId={(row) => row.supplierId}
        />
      </div>
    </ReportsPageShell>
  );
}
