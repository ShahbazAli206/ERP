'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { SettingsUserListItem } from './api';

/**
 * Read-only — `GET /settings/users` has no matching create/edit endpoint
 * (an explicit, existing scope decision; see `apps/api/src/modules/settings/settings.routes.ts`),
 * so unlike every other list in this app there is no actions column here.
 */
export const settingsUserColumns: ColumnDef<SettingsUserListItem, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    id: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="secondary">{row.original.role.name}</Badge>,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'outline'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>
    ),
  },
  {
    accessorKey: 'lastLoginAt',
    header: 'Last login',
    cell: ({ row }) => (row.original.lastLoginAt ? new Date(row.original.lastLoginAt).toLocaleString() : 'Never'),
  },
];
