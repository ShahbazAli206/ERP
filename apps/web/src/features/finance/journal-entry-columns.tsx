'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { formatMoney } from './format';
import type { JournalEntryListItem } from './api';

export const journalEntryColumns: ColumnDef<JournalEntryListItem, unknown>[] = [
  {
    accessorKey: 'entryDate',
    header: 'Date',
    enableSorting: true,
    cell: ({ row }) => (
      <Link href={`/finance/journal-entries/${row.original.id}`} className="font-medium hover:underline">
        {new Date(row.original.entryDate).toLocaleDateString()}
      </Link>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    cell: ({ row }) => row.original.description ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'reference',
    header: 'Reference',
    enableSorting: false,
    cell: ({ row }) => row.original.reference ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'totalDebit',
    header: 'Total debit',
    enableSorting: false,
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.totalDebit)}</span>,
  },
  {
    accessorKey: 'totalCredit',
    header: 'Total credit',
    enableSorting: false,
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.totalCredit)}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    enableSorting: true,
    cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
  },
];
