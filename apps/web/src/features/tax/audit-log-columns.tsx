'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { formatDateTime } from './format';
import type { AuditLogEntry } from './api';

export const auditLogColumns: ColumnDef<AuditLogEntry, unknown>[] = [
  {
    accessorKey: 'createdAt',
    header: 'When',
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
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
    accessorKey: 'userId',
    header: 'User ID',
    cell: ({ row }) => row.original.userId || <span className="text-muted-foreground">System</span>,
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
