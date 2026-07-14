'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MinusCircleIcon, PlusCircleIcon, TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { stockAdjustmentSchema, type StockAdjustmentFormInput, type StockAdjustmentFormValues } from './schemas';
import { useAllProducts, useStockAdjustment, useWarehouses } from './hooks';
import type { StockMovementResult } from './api';

const DEFAULTS: StockAdjustmentFormInput = {
  productId: '',
  warehouseId: '',
  direction: 'increase',
  quantity: 1,
  reason: '',
  lotNumber: '',
  costPrice: 0,
  expiryDate: '',
};

const DIRECTION_OPTIONS = [
  { value: 'increase', label: 'Increase' },
  { value: 'decrease', label: 'Decrease' },
];

export function StockAdjustmentView() {
  const productsQuery = useAllProducts();
  const warehousesQuery = useWarehouses();
  const mutation = useStockAdjustment();

  const [formError, setFormError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ direction: 'increase' | 'decrease'; lines: StockMovementResult[] } | null>(null);

  const form = useForm<StockAdjustmentFormInput, unknown, StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: DEFAULTS,
  });

  const direction = form.watch('direction');
  const productId = form.watch('productId');
  const selectedProduct = productsQuery.data?.data.find((p) => p.id === productId);

  const productOptions = (productsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }));
  const warehouseOptions = (warehousesQuery.data ?? []).map((w) => ({ value: w.id, label: w.name }));

  const onSubmit = (values: StockAdjustmentFormValues) => {
    setFormError(null);
    const input = {
      productId: values.productId,
      warehouseId: values.warehouseId,
      quantityDelta: values.direction === 'increase' ? values.quantity : -values.quantity,
      reason: values.reason,
      lotNumber: values.direction === 'increase' ? values.lotNumber : undefined,
      costPrice: values.direction === 'increase' ? values.costPrice : undefined,
      expiryDate: values.direction === 'increase' ? values.expiryDate || undefined : undefined,
    };

    mutation.mutate(input, {
      onSuccess: (lines) => {
        toast.success(values.direction === 'increase' ? 'Stock increased' : 'Stock decreased');
        setLastResult({ direction: values.direction, lines });
        form.reset({ ...DEFAULTS, productId: values.productId, warehouseId: values.warehouseId });
      },
      onError: (error) => setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Adjust stock</CardTitle>
          <CardDescription>
            Manually increase or decrease a product&apos;s stock in a warehouse. Decreases always consume the oldest lot
            first (FIFO) — pick the quantity and reason; the system chooses which lot(s) to draw from.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FieldGroup>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectFormField control={form.control} name="productId" label="Product" options={productOptions} disabled={mutation.isPending} />
                <SelectFormField
                  control={form.control}
                  name="warehouseId"
                  label="Warehouse"
                  options={warehouseOptions}
                  disabled={mutation.isPending}
                />
              </div>
              {selectedProduct && (
                <p className="text-sm text-muted-foreground">
                  Current stock on hand (all warehouses): <span className="tabular-nums font-medium">{selectedProduct.stockOnHand}</span>{' '}
                  {selectedProduct.unit}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <SelectFormField
                  control={form.control}
                  name="direction"
                  label="Direction"
                  options={DIRECTION_OPTIONS}
                  disabled={mutation.isPending}
                />
                <TextFormField control={form.control} name="quantity" label="Quantity" type="number" disabled={mutation.isPending} />
              </div>

              <TextFormField
                control={form.control}
                name="reason"
                label="Reason"
                placeholder="e.g. Damaged in warehouse, cycle count correction"
                disabled={mutation.isPending}
              />

              {direction === 'increase' && (
                <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-3">
                  <TextFormField
                    control={form.control}
                    name="lotNumber"
                    label="Lot number"
                    placeholder="LOT-2026-001"
                    disabled={mutation.isPending}
                  />
                  <TextFormField control={form.control} name="costPrice" label="Cost price" type="number" disabled={mutation.isPending} />
                  <TextFormField control={form.control} name="expiryDate" label="Expiry date" type="date" disabled={mutation.isPending} />
                </div>
              )}
            </FieldGroup>

            {formError && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t adjust stock</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {direction === 'increase' ? <PlusCircleIcon /> : <MinusCircleIcon />}
              {direction === 'increase' ? 'Increase stock' : 'Decrease stock'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Last adjustment</CardTitle>
          <CardDescription>
            {lastResult?.direction === 'decrease'
              ? 'Lots consumed, oldest first (FIFO).'
              : 'Lot topped up or created by your most recent submission.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lastResult ? (
            <ul className="space-y-2">
              {lastResult.lines.map((line, index) => (
                <li key={`${line.lotNumber}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{line.lotNumber}</span>
                  <span className="tabular-nums">
                    {lastResult.direction === 'increase' ? '+' : '-'}
                    {Math.abs(line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing recorded yet this session.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
