'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { PaperclipIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMoney } from '../format';
import type { ExpenseListItem } from '../api';

export const expenseColumns: ColumnDef<ExpenseListItem>[] = [
  {
    accessorKey: 'expenseDate',
    header: 'Date',
    cell: ({ row }) => (
      <Link href={`/expenses/${row.original.id}`} className="font-medium text-primary hover:underline">
        {formatDate(row.original.expenseDate)}
      </Link>
    ),
  },
  {
    accessorKey: 'categoryName',
    header: 'Category',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-64 text-muted-foreground">{row.original.description || '—'}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.amount)}</span>,
  },
  {
    accessorKey: 'attachmentCount',
    header: 'Attachments',
    cell: ({ row }) =>
      row.original.attachmentCount > 0 ? (
        <Badge variant="secondary" className="gap-1">
          <PaperclipIcon className="size-3" />
          {row.original.attachmentCount}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'createdByName',
    header: 'Recorded By',
  },
];
