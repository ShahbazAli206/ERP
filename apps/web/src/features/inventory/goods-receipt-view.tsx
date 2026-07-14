'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PackageCheckIcon, PlusIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { goodsReceiptSchema, type GoodsReceiptFormInput, type GoodsReceiptFormValues } from './schemas';
import { useAllProducts, useGoodsReceipt, usePurchaseOrderDetail, useReceivablePurchaseOrders, useWarehouses } from './hooks';
import type { GoodsReceiptResultLot } from './api';

const NO_PO = '__none__';
const BLANK_ITEM = { productId: '', quantity: 1, lotNumber: '', costPrice: 0, expiryDate: '' };

const DEFAULTS: GoodsReceiptFormInput = {
  warehouseId: '',
  purchaseOrderId: NO_PO,
  items: [],
};

export function GoodsReceiptView() {
  const warehousesQuery = useWarehouses();
  const productsQuery = useAllProducts();
  const receivablePosQuery = useReceivablePurchaseOrders();
  const mutation = useGoodsReceipt();

  const [lastResult, setLastResult] = useState<GoodsReceiptResultLot[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<GoodsReceiptFormInput, unknown, GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: DEFAULTS,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const purchaseOrderId = form.watch('purchaseOrderId');
  const selectedPoId = purchaseOrderId && purchaseOrderId !== NO_PO ? purchaseOrderId : undefined;
  const poDetailQuery = usePurchaseOrderDetail(selectedPoId);

  // Switching POs (or clearing it) clears any items pulled in from the previous PO.
  useEffect(() => {
    remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the selected PO changes
  }, [selectedPoId]);

  const productOptions = (productsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }));
  const warehouseOptions = (warehousesQuery.data ?? []).map((w) => ({ value: w.id, label: w.name }));
  const poOptions = [
    { value: NO_PO, label: 'None — standalone receipt' },
    ...(receivablePosQuery.data ?? []).map((po) => ({ value: po.id, label: `${po.poNumber} · ${po.supplierName} (${po.status})` })),
  ];

  function addRemainingPoItems() {
    if (!poDetailQuery.data) return;
    const existingLineIds = new Set(fields.map((f) => f.purchaseOrderItemId).filter(Boolean));
    for (const item of poDetailQuery.data.items) {
      const remaining = item.quantity - item.receivedQuantity;
      if (remaining <= 0 || existingLineIds.has(item.id)) continue;
      append({
        productId: item.productId,
        purchaseOrderItemId: item.id,
        quantity: remaining,
        lotNumber: '',
        costPrice: item.unitPrice,
        expiryDate: '',
      });
    }
  }

  const onSubmit = (values: GoodsReceiptFormValues) => {
    setFormError(null);
    const input = {
      warehouseId: values.warehouseId,
      purchaseOrderId: values.purchaseOrderId === NO_PO ? undefined : values.purchaseOrderId,
      items: values.items.map((item) => ({
        productId: item.productId,
        purchaseOrderItemId: item.purchaseOrderItemId || undefined,
        quantity: item.quantity,
        lotNumber: item.lotNumber,
        costPrice: item.costPrice,
        expiryDate: item.expiryDate || undefined,
      })),
    };

    mutation.mutate(input, {
      onSuccess: (lots) => {
        toast.success(`Goods receipt recorded — ${lots.length} lot${lots.length === 1 ? '' : 's'} added`);
        setLastResult(lots);
        form.reset(DEFAULTS);
      },
      onError: (error) => setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'),
    });
  };

  const itemsError = form.formState.errors.items?.message;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Receive stock</CardTitle>
          <CardDescription>
            Record new inventory lots for a warehouse — optionally linked to an open purchase order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FieldGroup>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectFormField
                  control={form.control}
                  name="warehouseId"
                  label="Warehouse"
                  options={warehouseOptions}
                  disabled={mutation.isPending}
                />
                <SelectFormField
                  control={form.control}
                  name="purchaseOrderId"
                  label="Link to purchase order (optional)"
                  options={poOptions}
                  disabled={mutation.isPending}
                />
              </div>
            </FieldGroup>

            {selectedPoId && (
              <Card className="bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-sm">Purchase order lines</CardTitle>
                  <CardDescription>Ordered vs. received so far — pick a remaining quantity to receive now.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {poDetailQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading PO items…</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-lg border bg-background">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Ordered</TableHead>
                              <TableHead>Received</TableHead>
                              <TableHead>Remaining</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {poDetailQuery.data?.items.map((item) => {
                              const remaining = item.quantity - item.receivedQuantity;
                              return (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    {item.productSku} — {item.productName}
                                  </TableCell>
                                  <TableCell className="tabular-nums">{item.quantity}</TableCell>
                                  <TableCell className="tabular-nums">{item.receivedQuantity}</TableCell>
                                  <TableCell className="tabular-nums">
                                    {remaining > 0 ? (
                                      remaining
                                    ) : (
                                      <Badge variant="secondary">Fully received</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addRemainingPoItems}>
                        <PlusIcon />
                        Add remaining line items
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Lots to receive</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(BLANK_ITEM)}
                  disabled={mutation.isPending}
                >
                  <PlusIcon />
                  Add item
                </Button>
              </div>

              {fields.length === 0 && <p className="text-sm text-muted-foreground">No items added yet.</p>}

              {fields.map((field, index) => {
                const isFromPo = Boolean(field.purchaseOrderItemId);
                const product = productsQuery.data?.data.find((p) => p.id === field.productId);
                return (
                  <div key={field.id} className="space-y-3 rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {isFromPo ? (
                          <div>
                            <p className="text-xs text-muted-foreground">Product (from PO line)</p>
                            <p className="text-sm font-medium">{product ? `${product.sku} — ${product.name}` : field.productId}</p>
                          </div>
                        ) : (
                          <SelectFormField
                            control={form.control}
                            name={`items.${index}.productId` as FieldPath<GoodsReceiptFormInput>}
                            label="Product"
                            options={productOptions}
                            disabled={mutation.isPending}
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(index)}
                        disabled={mutation.isPending}
                        aria-label="Remove item"
                      >
                        <XIcon />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <TextFormField
                        control={form.control}
                        name={`items.${index}.quantity` as FieldPath<GoodsReceiptFormInput>}
                        label="Quantity"
                        type="number"
                        disabled={mutation.isPending}
                      />
                      <TextFormField
                        control={form.control}
                        name={`items.${index}.lotNumber` as FieldPath<GoodsReceiptFormInput>}
                        label="Lot number"
                        placeholder="LOT-2026-001"
                        disabled={mutation.isPending}
                      />
                      <TextFormField
                        control={form.control}
                        name={`items.${index}.costPrice` as FieldPath<GoodsReceiptFormInput>}
                        label="Cost price"
                        type="number"
                        disabled={mutation.isPending}
                      />
                      <TextFormField
                        control={form.control}
                        name={`items.${index}.expiryDate` as FieldPath<GoodsReceiptFormInput>}
                        label="Expiry date"
                        type="date"
                        disabled={mutation.isPending}
                      />
                    </div>
                  </div>
                );
              })}

              {itemsError && <p className="text-sm text-destructive">{String(itemsError)}</p>}
            </div>

            {formError && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t record receipt</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              Record goods receipt
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Last receipt</CardTitle>
          <CardDescription>Lots created by your most recent submission.</CardDescription>
        </CardHeader>
        <CardContent>
          {lastResult ? (
            <ul className="space-y-2">
              {lastResult.map((lot) => (
                <li key={lot.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <PackageCheckIcon className="size-4 text-muted-foreground" />
                    {lot.lotNumber}
                  </span>
                  <span className="tabular-nums">+{lot.quantity}</span>
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
