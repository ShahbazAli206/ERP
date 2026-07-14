'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate, formatMoney } from '../format';
import type { SalesOrderListItem } from '../api';
import { SoStatusBadge } from './status-badge';

export const soColumns: ColumnDef<SalesOrderListItem>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order Number',
    cell: ({ row }) => (
      <Link href={`/sales/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'distributorName',
    header: 'Distributor',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <SoStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'orderDate',
    header: 'Order Date',
    cell: ({ row }) => formatDate(row.original.orderDate),
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => (
      <span className="tabular-nums">{formatMoney(row.original.totalAmount, row.original.currency)}</span>
    ),
  },
];
