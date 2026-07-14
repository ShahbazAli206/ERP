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
import type { SupplierListItem } from './api';

/**
 * Column factory (not a static array) so the actions column can close over
 * the current user's permissions and the list page's dialog-open callbacks
 * without those callbacks being recreated as anonymous props on every
 * render of the page itself.
 */
export function createSupplierColumns({
  canEdit,
  canDeactivate,
  onEdit,
  onDeactivate,
}: {
  canEdit: boolean;
  canDeactivate: boolean;
  onEdit: (supplierId: string) => void;
  onDeactivate: (supplier: SupplierListItem) => void;
}): ColumnDef<SupplierListItem, unknown>[] {
  const showActionsColumn = canEdit || canDeactivate;

  const columns: ColumnDef<SupplierListItem, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => (
        <Link href={`/suppliers/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'country',
      header: 'Country',
      enableSorting: true,
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
      enableSorting: false,
    },
    {
      accessorKey: 'contactCount',
      header: 'Contacts',
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.contactCount}</span>,
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
        const supplier = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(supplier.id)}>
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDeactivate && supplier.isActive && (
                  <DropdownMenuItem variant="destructive" onClick={() => onDeactivate(supplier)}>
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
