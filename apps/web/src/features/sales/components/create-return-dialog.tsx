'use client';

import { useEffect, useState } from 'react';
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
import { CheckboxFormField, SelectFormField, TextFormField, TextareaFormField } from '@/components/shared/form-fields';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api-client';
import { useWarehousesForSelect } from '../hooks';
import { createReturnFormSchema, type CreateReturnFormValues } from '../schemas';

export interface ReturnableItem {
  productId: string;
  productName: string;
  /** Quantity of this product still eligible to return (order quantity minus already-returned). */
  remaining: number;
}

/**
 * Records a return for a SHIPPED/DELIVERED order and, on submit, immediately
 * issues its credit note too (see `useCreateReturnWithCreditNote` — the
 * amount is auto-computed server-side from the order's effective unit price,
 * so this dialog never asks for one). Quantity is capped client-side against
 * `remaining` as a UX nicety; the API enforces the same cap authoritatively.
 */
export function CreateReturnDialog({
  trigger,
  items,
  isPending,
  onConfirm,
}: {
  trigger: React.ReactElement;
  items: ReturnableItem[];
  isPending: boolean;
  onConfirm: (values: {
    productId: string;
    quantity: number;
    reason?: string;
    restock?: { warehouseId: string; lotNumber: string };
  }) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const warehousesQuery = useWarehousesForSelect();

  const form = useForm<CreateReturnFormValues>({
    resolver: zodResolver(createReturnFormSchema),
    defaultValues: { productId: '', quantity: '1', reason: '', restock: false, warehouseId: '', lotNumber: '' },
  });

  const productId = form.watch('productId');
  const restock = form.watch('restock');
  const selected = items.find((i) => i.productId === productId);

  // Re-validate quantity against the newly-selected product's remaining-returnable cap.
  useEffect(() => {
    if (form.formState.touchedFields.quantity) form.trigger('quantity');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check when the selected product changes
  }, [productId]);

  const productOptions = items.map((i) => ({ value: i.productId, label: `${i.productName} (${i.remaining} returnable)` }));
  const warehouseOptions = (warehousesQuery.data ?? []).map((w) => ({ value: w.id, label: w.name }));

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
          <DialogTitle>Record a return</DialogTitle>
          <DialogDescription>
            A credit note is issued automatically for the returned quantity&apos;s effective (discounted) value.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            setErrorMessage(null);
            const quantity = Number(values.quantity);
            if (selected && quantity > selected.remaining) {
              form.setError('quantity', { message: `Only ${selected.remaining} of this product remain returnable` });
              return;
            }
            try {
              await onConfirm({
                productId: values.productId,
                quantity,
                reason: values.reason || undefined,
                restock: values.restock ? { warehouseId: values.warehouseId!, lotNumber: values.lotNumber! } : undefined,
              });
              setOpen(false);
              form.reset();
            } catch (error) {
              setErrorMessage(error instanceof ApiError ? error.message : 'Could not record the return.');
            }
          })}
          className="space-y-4"
        >
          <FieldGroup>
            <SelectFormField
              control={form.control}
              name="productId"
              label="Product"
              placeholder="Select a product from this order"
              options={productOptions}
              disabled={isPending}
            />
            <TextFormField
              control={form.control}
              name="quantity"
              label="Quantity"
              type="number"
              description={selected ? `Up to ${selected.remaining} returnable` : undefined}
              disabled={isPending}
            />
            <TextareaFormField control={form.control} name="reason" label="Reason" disabled={isPending} />
            <CheckboxFormField
              control={form.control}
              name="restock"
              label="Restock this quantity into inventory"
              disabled={isPending}
            />
            {restock && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectFormField
                  control={form.control}
                  name="warehouseId"
                  label="Warehouse"
                  placeholder={warehousesQuery.isLoading ? 'Loading...' : 'Select a warehouse'}
                  options={warehouseOptions}
                  disabled={isPending}
                />
                <TextFormField
                  control={form.control}
                  name="lotNumber"
                  label="Lot Number"
                  placeholder="e.g. RETURN-001"
                  disabled={isPending}
                />
              </div>
            )}
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Could not record the return</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              Record return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
