'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { PlusIcon, Trash2Icon, TruckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FieldGroup, FieldSet, FieldLegend, Field, FieldError } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { TriangleAlertIcon } from 'lucide-react';
import { TextFormField } from '@/components/shared/form-fields';
import { ShipmentSelectFormField } from './select-form-field';
import { ApiError } from '@/lib/api-client';
import { useCreateShipment, usePurchaseOrderDetail, usePurchaseOrderOptions, useProductOptions } from './hooks';
import { NO_PURCHASE_ORDER, createShipmentSchema, type CreateShipmentFormInput, type CreateShipmentFormValues } from './schemas';

const DEFAULT_VALUES: CreateShipmentFormInput = {
  purchaseOrderId: NO_PURCHASE_ORDER,
  containerNumber: '',
  originPort: '',
  destinationPort: '',
  estimatedArrival: '',
  freightCost: '0' as unknown as number,
  insuranceCost: '0' as unknown as number,
  dutyCost: '0' as unknown as number,
  customsCharges: '0' as unknown as number,
  currency: 'USD',
  exchangeRateToBase: '1' as unknown as number,
  items: [],
};

/**
 * Create-shipment form. Optionally linked to a purchase order — picking one
 * offers a one-click "Load items from PO" that prefills the item list (still
 * freely editable), otherwise items are added manually against the product
 * catalog. Landed cost itself is computed server-side; this form only
 * collects the inputs (freight/insurance/duty/customs + currency/exchange
 * rate) that feed that calculation.
 */
export function ShipmentCreateForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateShipmentFormInput, unknown, CreateShipmentFormValues>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const itemsArray = useFieldArray({ control: form.control, name: 'items' });
  const purchaseOrderId = form.watch('purchaseOrderId');
  const selectedPoId = purchaseOrderId && purchaseOrderId !== NO_PURCHASE_ORDER ? purchaseOrderId : undefined;

  const poOptionsQuery = usePurchaseOrderOptions();
  const productOptionsQuery = useProductOptions();
  const poDetailQuery = usePurchaseOrderDetail(selectedPoId);
  const mutation = useCreateShipment();

  // Picking a PO sets a sensible default currency/rate match — still editable.
  useEffect(() => {
    if (!poDetailQuery.data) return;
    form.setValue('currency', poDetailQuery.data.currency);
  }, [poDetailQuery.data, form]);

  const loadItemsFromPo = () => {
    if (!poDetailQuery.data) return;
    itemsArray.replace(
      poDetailQuery.data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity as unknown as number,
      })),
    );
  };

  const productOptions = (productOptionsQuery.data ?? []).map((product) => ({
    value: product.id,
    label: `${product.sku} — ${product.name}`,
  }));

  const onSubmit = (values: CreateShipmentFormValues) => {
    setFormError(null);
    const payload = {
      ...values,
      purchaseOrderId: values.purchaseOrderId === NO_PURCHASE_ORDER ? undefined : values.purchaseOrderId,
    };
    mutation.mutate(payload, {
      onSuccess: (shipment) => {
        router.push(`/shipments/${shipment.id}`);
      },
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Purchase order link</CardTitle>
          <CardDescription>Optional — link this shipment to an existing PO, or leave standalone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup>
            <ShipmentSelectFormField
              control={form.control}
              name="purchaseOrderId"
              label="Purchase order"
              options={[
                { value: NO_PURCHASE_ORDER, label: 'Standalone shipment (no PO)' },
                ...(poOptionsQuery.data ?? []).map((po) => ({
                  value: po.id,
                  label: `${po.poNumber} — ${po.supplierName} (${po.status})`,
                })),
              ]}
            />
          </FieldGroup>
          {selectedPoId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!poDetailQuery.data}
              onClick={loadItemsFromPo}
            >
              <TruckIcon />
              {poDetailQuery.isLoading ? 'Loading PO items…' : 'Load items from PO'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Container &amp; route</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <TextFormField control={form.control} name="containerNumber" label="Container number" placeholder="e.g. MSKU1234567" />
            <TextFormField control={form.control} name="estimatedArrival" label="Estimated arrival" type="date" />
            <TextFormField control={form.control} name="originPort" label="Origin port" placeholder="e.g. Shanghai" />
            <TextFormField control={form.control} name="destinationPort" label="Destination port" placeholder="e.g. Karachi" />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costs &amp; currency</CardTitle>
          <CardDescription>
            Freight, insurance, duty and customs are allocated across items automatically once the shipment is created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextFormField control={form.control} name="currency" label="Currency" placeholder="USD" />
            <TextFormField control={form.control} name="exchangeRateToBase" label="Exchange rate to base" type="number" />
            <TextFormField control={form.control} name="freightCost" label="Freight cost" type="number" />
            <TextFormField control={form.control} name="insuranceCost" label="Insurance cost" type="number" />
            <TextFormField control={form.control} name="dutyCost" label="Duty cost" type="number" />
            <TextFormField control={form.control} name="customsCharges" label="Customs charges" type="number" />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>The products travelling in this shipment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldSet>
            <FieldLegend variant="label" className="sr-only">
              Shipment items
            </FieldLegend>
            {itemsArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No items yet — add one below.</p>
            )}
            {itemsArray.fields.map((field, index) => (
              <Field key={field.id} orientation="responsive" className="items-end gap-3 rounded-lg border p-3">
                <ShipmentSelectFormField
                  control={form.control}
                  name={`items.${index}.productId` as FieldPath<CreateShipmentFormInput>}
                  label="Product"
                  options={productOptions}
                  className="flex-1"
                />
                <TextFormField
                  control={form.control}
                  name={`items.${index}.quantity` as FieldPath<CreateShipmentFormInput>}
                  label="Quantity"
                  type="number"
                  className="w-32"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => itemsArray.remove(index)} aria-label="Remove item">
                  <Trash2Icon />
                </Button>
              </Field>
            ))}
            <FieldError errors={form.formState.errors.items?.message ? [{ message: form.formState.errors.items.message }] : undefined} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => itemsArray.append({ productId: '', quantity: 1 as unknown as number })}
            >
              <PlusIcon />
              Add item
            </Button>
          </FieldSet>
        </CardContent>
      </Card>

      {formError && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t create shipment</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/shipments')}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Create shipment
        </Button>
      </div>
    </form>
  );
}
