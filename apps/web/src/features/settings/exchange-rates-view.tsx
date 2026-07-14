'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CoinsIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api-client';
import { SettingsPageShell } from './settings-nav';
import { ConfirmDialog } from './confirm-dialog';
import { ExchangeRateFormDialog } from './exchange-rate-form-dialog';
import { useDeleteExchangeRate, useExchangeRates } from './hooks';
import type { ExchangeRate } from './api';

/**
 * A small non-paginated `Table` (not the paginated `DataTable`) — `GET
 * /settings/exchange-rates` returns the full set in one call (16 seeded
 * currencies), the same reasoning as `features/distributors/pricing-group-list-view.tsx`.
 */
export function ExchangeRatesView() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('settings:create');
  const canEdit = hasPermission('settings:edit');
  const canDelete = hasPermission('settings:delete');

  const query = useExchangeRates();
  const deleteMutation = useDeleteExchangeRate();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExchangeRate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExchangeRate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showActionsColumn = canEdit || canDelete;

  return (
    <SettingsPageShell
      title="Exchange Rates"
      description="Rates used to convert foreign-currency amounts into the base currency."
      actions={
        canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Exchange Rate
          </Button>
        )
      }
    >
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead>Rate to base currency</TableHead>
              <TableHead>Last updated</TableHead>
              {showActionsColumn && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={showActionsColumn ? 4 : 3}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.data?.length ? (
              query.data.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.currencyCode}</TableCell>
                  <TableCell className="tabular-nums">{rate.rateToBase.toLocaleString(undefined, { maximumFractionDigits: 4 })}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(rate.updatedAt).toLocaleString()}</TableCell>
                  {showActionsColumn && (
                    <TableCell>
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
                              <DropdownMenuItem onClick={() => setEditTarget(rate)}>
                                <PencilIcon />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteTarget(rate);
                                }}
                              >
                                <Trash2Icon />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showActionsColumn ? 4 : 3} className="h-56 text-center">
                  <Empty className="border-0 p-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CoinsIcon />
                      </EmptyMedia>
                      <EmptyTitle>No exchange rates yet</EmptyTitle>
                      <EmptyDescription>Add a currency&apos;s rate to the base currency to start converting foreign amounts.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {canCreate && <ExchangeRateFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && editTarget && (
        <ExchangeRateFormDialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)} exchangeRate={editTarget} />
      )}

      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete exchange rate"
          description={`Delete the rate for "${deleteTarget?.currencyCode ?? ''}"? Amounts in this currency will no longer convert to the base currency.`}
          confirmLabel="Delete"
          isPending={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.currencyCode, {
              onSuccess: () => {
                toast.success('Exchange rate deleted');
                setDeleteTarget(null);
              },
              onError: (error) => setDeleteError(error instanceof ApiError ? error.message : 'Could not delete exchange rate'),
            });
          }}
        />
      )}
    </SettingsPageShell>
  );
}
