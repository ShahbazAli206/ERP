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
import { SelectFormField } from '@/components/shared/form-fields';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api-client';
import { useWarehousesForSelect } from '../hooks';
import { confirmOrderFormSchema, type ConfirmOrderFormValues } from '../schemas';

/**
 * Confirming a DRAFT order needs a warehouse to consume stock FIFO from
 * (`POST /sales/orders/:id/confirm`). Unlike the plain `ConfirmActionDialog`,
 * this is its own form-in-a-dialog for the warehouse picker AND because a
 * failed confirm (insufficient stock) needs to stay visible as more than a
 * toast — the API's error message (`Insufficient stock: requested X, only Y
 * available`) is rendered as a persistent alert inside the dialog so it
 * doesn't get missed once the toast auto-dismisses.
 */
export function ConfirmOrderDialog({
  trigger,
  isPending,
  onConfirm,
}: {
  trigger: React.ReactElement;
  isPending: boolean;
  onConfirm: (warehouseId: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const warehousesQuery = useWarehousesForSelect();

  const form = useForm<ConfirmOrderFormValues>({
    resolver: zodResolver(confirmOrderFormSchema),
    defaultValues: { warehouseId: '' },
  });

  const warehouseOptions = (warehousesQuery.data ?? []).map((w) => ({
    value: w.id,
    label: w.location ? `${w.name} (${w.location})` : w.name,
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (!next) {
          form.reset();
          setErrorMessage(null);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm sales order</DialogTitle>
          <DialogDescription>
            Choose the warehouse to consume stock from — items are drawn FIFO (oldest lot first). This
            cannot be undone directly; cancelling afterward reverses the consumption.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            setErrorMessage(null);
            try {
              await onConfirm(values.warehouseId);
              setOpen(false);
              form.reset();
            } catch (error) {
              // Toast already fired from the mutation's onError; also surface it inline so it
              // survives the toast's auto-dismiss and the dialog stays open for a retry.
              setErrorMessage(error instanceof ApiError ? error.message : 'Could not confirm the order.');
            }
          })}
          className="space-y-4"
        >
          <FieldGroup>
            <SelectFormField
              control={form.control}
              name="warehouseId"
              label="Warehouse"
              placeholder={warehousesQuery.isLoading ? 'Loading warehouses...' : 'Select a warehouse'}
              options={warehouseOptions}
              disabled={isPending}
            />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Could not confirm the order</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              Confirm order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
