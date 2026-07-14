'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '../format';
import type { InvoiceListItem } from '../api';
import { InvoiceStatusBadge } from './status-badge';

// `InvoiceListItemDto` (the list endpoint's shape) doesn't carry `currency` — only the
// per-invoice detail endpoint joins through to the sales order for that. Plain numeric
// formatting here avoids assuming every invoice is the same currency (see the detail
// page/`InvoiceSection` for currency-aware amounts).
function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const invoiceColumns: ColumnDef<InvoiceListItem>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice Number',
    cell: ({ row }) => <span className="font-medium">{row.original.invoiceNumber}</span>,
  },
  {
    accessorKey: 'orderNumber',
    header: 'Sales Order',
    cell: ({ row }) => (
      <Link href={`/sales/${row.original.salesOrderId}`} className="text-primary hover:underline">
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
    cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'issueDate',
    header: 'Issue Date',
    cell: ({ row }) => formatDate(row.original.issueDate),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.totalAmount)}</span>,
  },
  {
    accessorKey: 'paidAmount',
    header: 'Paid',
    cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.paidAmount)}</span>,
  },
];
