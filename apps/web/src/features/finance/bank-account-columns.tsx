'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatMoney } from './format';
import type { BankAccount } from './api';

/**
 * Column factory (not a static array) so the actions column can close over
 * the current user's permissions and the list page's dialog-open callbacks —
 * mirrors `features/suppliers/columns.tsx`.
 */
export function createBankAccountColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (bankAccount: BankAccount) => void;
  onDelete: (bankAccount: BankAccount) => void;
}): ColumnDef<BankAccount, unknown>[] {
  const showActionsColumn = canEdit || canDelete;

  const columns: ColumnDef<BankAccount, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Account name',
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'bankName',
      header: 'Bank',
      enableSorting: true,
    },
    {
      accessorKey: 'accountNumber',
      header: 'Account number',
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.accountNumber}</span>,
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
      enableSorting: false,
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      enableSorting: true,
      cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.balance)}</span>,
    },
  ];

  if (showActionsColumn) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const bankAccount = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(bankAccount)}>
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(bankAccount)}>
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
