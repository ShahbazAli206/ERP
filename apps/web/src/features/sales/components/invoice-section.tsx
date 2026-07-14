'use client';

import { ReceiptIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/features/auth/use-auth';
import { useGenerateInvoice, useInvoiceForOrder, useRecordPayment } from '../hooks';
import { formatDate, formatMoney } from '../format';
import { NOT_INVOICEABLE_STATUSES, PAYMENT_METHOD_LABELS, type PaymentMethod } from '../status';
import type { SalesOrderDetail } from '../api';
import { InvoiceStatusBadge } from './status-badge';
import { RecordPaymentDialog } from './record-payment-dialog';

/**
 * Invoice + payment history for one sales order, rendered as a section of
 * the order detail page (rather than requiring a separate click-through) —
 * generating an invoice and recording payments against it are both direct
 * follow-ons to the order itself. Full invoice history across all orders is
 * separately browsable at `/sales/invoices`.
 */
export function InvoiceSection({ order }: { order: SalesOrderDetail }) {
  const { hasPermission } = useAuth();
  const canCreateInvoice = hasPermission('sales:create');
  const canRecordPayment = hasPermission('sales:edit');

  const { invoice, hasInvoice, isLoading } = useInvoiceForOrder(order.id);
  const generateMutation = useGenerateInvoice(order.id);
  const recordPaymentMutation = useRecordPayment(invoice?.id ?? '', order.id);

  if (NOT_INVOICEABLE_STATUSES.includes(order.status)) {
    return (
      <p className="text-sm text-muted-foreground">
        {order.status === 'DRAFT'
          ? 'An invoice can be generated once this order is confirmed.'
          : 'This order was cancelled — no invoice can be generated.'}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!hasInvoice || !invoice) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">No invoice has been generated for this order yet.</p>
        {canCreateInvoice && (
          <Button size="sm" disabled={generateMutation.isPending} onClick={() => generateMutation.mutate(30)}>
            <ReceiptIcon /> Generate invoice
          </Button>
        )}
      </div>
    );
  }

  const canPay = canRecordPayment && invoice.balanceDue > 0.01 && invoice.status !== 'CANCELLED';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{invoice.invoiceNumber}</p>
          <p className="text-sm text-muted-foreground">
            Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-medium tabular-nums">{formatMoney(invoice.totalAmount, invoice.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="font-medium tabular-nums">{formatMoney(invoice.paidAmount, invoice.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Credit notes</dt>
          <dd className="font-medium tabular-nums">{formatMoney(invoice.creditNotesTotal, invoice.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Balance due</dt>
          <dd className="font-medium tabular-nums">{formatMoney(invoice.balanceDue, invoice.currency)}</dd>
        </div>
      </dl>

      <div className="space-y-2">
        <p className="text-sm font-medium">Payments</p>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[payment.method]}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.reference ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(payment.amount, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {canPay && (
        <RecordPaymentDialog
          trigger={<Button size="sm">Record payment</Button>}
          balanceDue={invoice.balanceDue}
          currency={invoice.currency}
          isPending={recordPaymentMutation.isPending}
          onConfirm={(values) =>
            recordPaymentMutation.mutateAsync({ ...values, method: values.method as PaymentMethod })
          }
        />
      )}
    </div>
  );
}
