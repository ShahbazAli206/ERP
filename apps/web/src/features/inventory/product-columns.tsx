'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, PencilIcon, PowerIcon, TriangleAlertIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import type { ProductListItem } from './api';

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Column factory (not a static array) so the actions column can close over
 * the current user's permissions and the list page's dialog-open callbacks —
 * mirrors `features/suppliers/columns.tsx`.
 */
export function createProductColumns({
  canEdit,
  canDeactivate,
  onEdit,
  onDeactivate,
}: {
  canEdit: boolean;
  canDeactivate: boolean;
  onEdit: (productId: string) => void;
  onDeactivate: (product: ProductListItem) => void;
}): ColumnDef<ProductListItem, unknown>[] {
  const showActionsColumn = canEdit || canDeactivate;

  const columns: ColumnDef<ProductListItem, unknown>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      enableSorting: true,
      cell: ({ row }) => (
        <Link href={`/inventory/products/${row.original.id}`} className="font-medium hover:underline">
          {row.original.sku}
        </Link>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.name}</span>
          {row.original.barcode && <span className="text-xs text-muted-foreground">{row.original.barcode}</span>}
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Category',
      enableSorting: false,
      cell: ({ row }) => row.original.categoryName ?? <span className="text-muted-foreground">Uncategorized</span>,
    },
    {
      accessorKey: 'stockOnHand',
      header: 'Stock on hand',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 tabular-nums">
          <span>
            {row.original.stockOnHand} {row.original.unit}
          </span>
          {row.original.isLowStock && (
            <Badge
              variant="outline"
              className="gap-1"
              style={{ color: STATUS_COLOR_VAR.warning, borderColor: STATUS_COLOR_VAR.warning }}
            >
              <TriangleAlertIcon className="size-3" />
              Low stock
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'reorderLevel',
      header: 'Reorder level',
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.reorderLevel}</span>,
    },
    {
      accessorKey: 'sellingPrice',
      header: 'Selling price',
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.sellingPrice)}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'secondary' : 'outline'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
  ];

  if (showActionsColumn) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(product.id)}>
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDeactivate && product.isActive && (
                  <DropdownMenuItem variant="destructive" onClick={() => onDeactivate(product)}>
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
