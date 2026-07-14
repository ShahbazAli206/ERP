'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, PencilIcon, PowerIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DistributorListItem } from './api';
import { formatCurrency } from './format';

/**
 * Column factory (not a static array) so the actions column can close over
 * the current user's permissions and the list page's dialog-open callbacks.
 * Mirrors `features/suppliers/columns.tsx`.
 */
export function createDistributorColumns({
  canEdit,
  canDeactivate,
  onEdit,
  onDeactivate,
}: {
  canEdit: boolean;
  canDeactivate: boolean;
  onEdit: (distributorId: string) => void;
  onDeactivate: (distributor: DistributorListItem) => void;
}): ColumnDef<DistributorListItem, unknown>[] {
  const showActionsColumn = canEdit || canDeactivate;

  const columns: ColumnDef<DistributorListItem, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => (
        <Link href={`/distributors/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'region',
      header: 'Region',
      enableSorting: true,
    },
    {
      accessorKey: 'creditLimit',
      header: 'Credit Limit',
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.creditLimit)}</span>,
    },
    {
      accessorKey: 'pricingGroupName',
      header: 'Pricing Group',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.pricingGroupName ? (
          <Badge variant="outline">{row.original.pricingGroupName}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'secondary' : 'outline'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (showActionsColumn) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const distributor = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" onClick={(event) => event.stopPropagation()}>
                  <MoreHorizontalIcon />
                  <span className="sr-only">Open actions</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(distributor.id)}>
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDeactivate && distributor.isActive && (
                  <DropdownMenuItem variant="destructive" onClick={() => onDeactivate(distributor)}>
                    <PowerIcon />
                    Deactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
