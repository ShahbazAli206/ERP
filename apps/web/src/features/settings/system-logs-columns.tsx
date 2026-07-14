'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { SystemLog } from './api';

export const systemLogColumns: ColumnDef<SystemLog, unknown>[] = [
  {
    accessorKey: 'createdAt',
    header: 'When',
    cell: ({ row }) => <span className="whitespace-nowrap">{new Date(row.original.createdAt).toLocaleString()}</span>,
  },
  {
    accessorKey: 'action',
    header: 'Action',
  },
  {
    accessorKey: 'entityType',
    header: 'Entity type',
  },
  {
    accessorKey: 'entityId',
    header: 'Entity ID',
    cell: ({ row }) => row.original.entityId || <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'userName',
    header: 'User',
    cell: ({ row }) => row.original.userName || <span className="text-muted-foreground">System</span>,
  },
  {
    accessorKey: 'metadata',
    header: 'Metadata',
    cell: ({ row }) => (
      <span className="block max-w-64 truncate text-xs text-muted-foreground" title={row.original.metadata ?? undefined}>
        {row.original.metadata || '—'}
      </span>
    ),
  },
];
