'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Account } from './api';

const TYPE_BADGE_LABEL: Record<Account['type'], string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expense',
};

/**
 * Column factory (not a static array) so the actions column can close over
 * the current user's permissions and the list page's dialog-open callbacks —
 * mirrors `features/suppliers/columns.tsx`.
 */
export function createAccountColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}): ColumnDef<Account, unknown>[] {
  const showActionsColumn = canEdit || canDelete;

  const columns: ColumnDef<Account, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      enableSorting: true,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      enableSorting: false,
      cell: ({ row }) => <Badge variant="secondary">{TYPE_BADGE_LABEL[row.original.type]}</Badge>,
    },
  ];

  if (showActionsColumn) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const account = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(account)}>
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(account)}>
                    <Trash2Icon />
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
