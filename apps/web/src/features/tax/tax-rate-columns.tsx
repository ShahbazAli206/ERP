'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatTaxType } from './format';
import type { TaxRate } from './api';

/**
 * Column factory (not a static array) so the actions column can close over the current user's
 * permissions and the list page's dialog-open callbacks — see
 * `src/features/suppliers/columns.tsx` for the same pattern.
 */
export function createTaxRateColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (taxId: string) => void;
  onDelete: (tax: TaxRate) => void;
}): ColumnDef<TaxRate, unknown>[] {
  const showActionsColumn = canEdit || canDelete;

  const columns: ColumnDef<TaxRate, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="outline">{formatTaxType(row.original.type)}</Badge>,
    },
    {
      accessorKey: 'rate',
      header: 'Rate',
      cell: ({ row }) => <span className="tabular-nums">{row.original.rate}%</span>,
    },
    {
      accessorKey: 'appliesTo',
      header: 'Applies to',
      cell: ({ row }) => row.original.appliesTo || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
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
      cell: ({ row }) => {
        const tax = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(tax.id)}>
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(tax)}>
                    <TrashIcon />
                    Delete
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
