'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '../format';
import { formatMoney } from '../format';
import type { PurchaseOrderListItem } from '../api';
import { PoStatusBadge } from './status-badge';

export const poColumns: ColumnDef<PurchaseOrderListItem>[] = [
  {
    accessorKey: 'poNumber',
    header: 'PO Number',
    cell: ({ row }) => (
      <Link href={`/procurement/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.poNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'supplierName',
    header: 'Supplier',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <PoStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'orderDate',
    header: 'Order Date',
    cell: ({ row }) => formatDate(row.original.orderDate),
  },
  {
    accessorKey: 'expectedArrival',
    header: 'Expected Arrival',
    cell: ({ row }) => (row.original.expectedArrival ? formatDate(row.original.expectedArrival) : '—'),
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => (
      <span className="tabular-nums">{formatMoney(row.original.totalAmount, row.original.currency)}</span>
    ),
  },
];
