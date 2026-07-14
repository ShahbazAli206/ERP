'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, WarehouseIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { formatMoney } from './format';
import { useInventoryReport } from './hooks';
import type { InventoryReportLine } from './api';

const columns: ColumnDef<InventoryReportLine, unknown>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'name', header: 'Product' },
  { accessorKey: 'quantity', header: 'Qty on hand', cell: ({ row }) => <span className="tabular-nums">{row.original.quantity}</span> },
  {
    accessorKey: 'valuationTotal',
    header: 'Valuation',
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.valuationTotal)}</span>,
  },
  {
    id: 'flags',
    header: 'Flags',
    cell: ({ row }) => (
      <div className="flex gap-1.5">
        {row.original.isLowStock && <Badge variant="destructive">Low stock</Badge>}
        {row.original.isExpiringSoon && <Badge variant="outline">Expiring soon</Badge>}
      </div>
    ),
  },
];

/** This report returns every line in one response (no server-side pagination) — slice client-side to feed `DataTable`'s "current page only" contract. */
export function InventoryReportView() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const query = useInventoryReport({});

  const pageRows = useMemo(() => {
    const lines = query.data?.lines ?? [];
    const start = pagination.pageIndex * pagination.pageSize;
    return lines.slice(start, start + pagination.pageSize);
  }, [query.data, pagination]);

  const lowStockCount = query.data?.lines.filter((l) => l.isLowStock).length ?? 0;

  return (
    <ReportsPageShell title="Inventory Report" description="Valuation per product, with low-stock and expiring-soon flags.">
      <div className="space-y-4">
        <div className="flex justify-end">
          <ReportToolbar kind="inventory" params={{}} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title="Grand total valuation"
            value={query.data ? formatMoney(query.data.grandTotal) : '—'}
            icon={WarehouseIcon}
            isLoading={query.isLoading}
          />
          <StatCard title="Low stock products" value={lowStockCount} icon={AlertTriangleIcon} isLoading={query.isLoading} />
        </div>

        <DataTable
          columns={columns}
          data={pageRows}
          rowCount={query.data?.lines.length ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={query.isLoading}
          emptyTitle="No products"
          emptyDescription="No products found in inventory."
          getRowId={(row) => row.productId}
        />
      </div>
    </ReportsPageShell>
  );
}
