'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api-client';
import { formatMoney } from '../format';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../status';
import { recordPaymentFormSchema, type RecordPaymentFormValues } from '../schemas';

/**
 * Records a payment against an invoice — partial or full. The API rejects an
 * overpayment (`amount` that would push `paidAmount` past `totalAmount`) with
 * a clear `badRequest` message; that message is surfaced as a persistent
 * inline alert (same pattern as `confirm-order-dialog.tsx`) rather than just
 * a toast, since it names the exact remaining balance the user should retry
 * with.
 */
export function RecordPaymentDialog({
  trigger,
  balanceDue,
  currency,
  isPending,
  onConfirm,
}: {
  trigger: React.ReactElement;
  balanceDue: number;
  currency: string;
  isPending: boolean;
  onConfirm: (values: { amount: number; method: string; paymentDate?: string; reference?: string }) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: { amount: balanceDue > 0 ? String(balanceDue.toFixed(2)) : '', method: 'BANK_TRANSFER', paymentDate: '', reference: '' },
  });

  const methodOptions = PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (next) {
          // `useForm`'s `defaultValues` are only applied once at mount, so re-opening this
          // same dialog instance after a prior payment (which changes `balanceDue` via props)
          // would otherwise keep prefilling the amount from the *first* time it opened. Reset
          // explicitly to the current balance whenever it opens.
          form.reset({
            amount: balanceDue > 0 ? String(balanceDue.toFixed(2)) : '',
            method: 'BANK_TRANSFER',
            paymentDate: '',
            reference: '',
          });
          setErrorMessage(null);
        } else {
          form.reset();
          setErrorMessage(null);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            Balance due is currently {formatMoney(balanceDue, currency)}. Partial payments are allowed;
            overpaying beyond the balance is rejected.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            setErrorMessage(null);
            try {
              await onConfirm({
                amount: Number(values.amount),
                method: values.method,
                paymentDate: values.paymentDate ? new Date(values.paymentDate).toISOString() : undefined,
                reference: values.reference || undefined,
              });
              setOpen(false);
              form.reset();
            } catch (error) {
              setErrorMessage(error instanceof ApiError ? error.message : 'Could not record the payment.');
            }
          })}
          className="space-y-4"
        >
          <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            <TextFormField
              control={form.control}
              name="amount"
              label="Amount"
              type="number"
              placeholder="0.00"
              disabled={isPending}
            />
            <SelectFormField
              control={form.control}
              name="method"
              label="Method"
              options={methodOptions}
              disabled={isPending}
            />
            <TextFormField
              control={form.control}
              name="paymentDate"
              label="Payment Date"
              type="date"
              description="Defaults to today if left blank"
              disabled={isPending}
            />
            <TextFormField
              control={form.control}
              name="reference"
              label="Reference"
              placeholder="Cheque #, transaction ID, etc."
              disabled={isPending}
            />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Could not record the payment</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
