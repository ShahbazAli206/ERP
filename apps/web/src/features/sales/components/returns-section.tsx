'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/use-auth';
import { useCreateReturnWithCreditNote, useCreditNotes, useReturns } from '../hooks';
import { formatDate, formatMoney } from '../format';
import { RETURNABLE_STATUSES } from '../status';
import type { SalesOrderDetail } from '../api';
import { CreateReturnDialog, type ReturnableItem } from './create-return-dialog';

/**
 * Returns + auto-generated credit notes for one sales order, rendered as a
 * section of the order detail page (per the task's brief: "Surface this from
 * the order detail page"). Both `/sales/returns` and `/sales/credit-notes`
 * are plain unpaginated arrays server-side, so this filters the full lists
 * down to this order client-side rather than adding a query param the API
 * doesn't support.
 */
export function ReturnsSection({ order }: { order: SalesOrderDetail }) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('sales:edit');

  const returnsQuery = useReturns();
  const creditNotesQuery = useCreditNotes();
  const createMutation = useCreateReturnWithCreditNote(order.id);

  if (!RETURNABLE_STATUSES.includes(order.status)) {
    return (
      <p className="text-sm text-muted-foreground">
        Returns can be recorded once this order has been shipped or delivered.
      </p>
    );
  }

  if (returnsQuery.isLoading || creditNotesQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const orderReturns = (returnsQuery.data ?? []).filter((r) => r.salesOrderId === order.id);
  const creditNotesById = new Map((creditNotesQuery.data ?? []).map((cn) => [cn.salesReturnId, cn]));

  const returnableItems: ReturnableItem[] = order.items
    .map((item) => {
      const alreadyReturned = orderReturns
        .filter((r) => r.productId === item.productId)
        .reduce((sum, r) => sum + r.quantity, 0);
      return { productId: item.productId, productName: item.productName, remaining: item.quantity - alreadyReturned };
    })
    .filter((i) => i.remaining > 0);

  return (
    <div className="space-y-4">
      {orderReturns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No returns recorded for this order yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Credit Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Recorded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderReturns.map((r) => {
                const creditNote = creditNotesById.get(r.id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.productName}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{r.reason ?? '—'}</TableCell>
                    <TableCell>
                      {creditNote ? (
                        <Badge variant="outline">{creditNote.creditNoteNumber}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {creditNote ? formatMoney(creditNote.amount, order.currency) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {canCreate && returnableItems.length > 0 && (
        <CreateReturnDialog
          trigger={<Button size="sm">Record return</Button>}
          items={returnableItems}
          isPending={createMutation.isPending}
          onConfirm={(values) => createMutation.mutateAsync({ salesOrderId: order.id, ...values })}
        />
      )}
      {canCreate && returnableItems.length === 0 && orderReturns.length > 0 && (
        <p className="text-sm text-muted-foreground">Every item on this order has already been fully returned.</p>
      )}
    </div>
  );
}
