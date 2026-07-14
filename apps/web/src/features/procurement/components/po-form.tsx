'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FieldGroup } from '@/components/ui/field';
import { SelectFormField, TextFormField, TextareaFormField } from '@/components/shared/form-fields';
import { useProductsForSelect, useSuppliersForSelect } from '../hooks';
import { purchaseOrderFormSchema, type PurchaseOrderFormValues } from '../schemas';
import { PoLineItems } from './po-line-items';
import type { PurchaseOrderDetail } from '../api';

/**
 * Shared create/edit form. Editing only ever happens while a PO is DRAFT
 * (enforced server-side and mirrored here by disabling the supplier field
 * once a PO already exists — the API's `updatePurchaseOrderSchema` doesn't
 * accept `supplierId` at all).
 */
export function PoForm({
  mode,
  purchaseOrder,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  mode: 'create' | 'edit';
  purchaseOrder?: PurchaseOrderDetail;
  onSubmit: (values: PurchaseOrderFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const suppliersQuery = useSuppliersForSelect();
  const productsQuery = useProductsForSelect();

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: purchaseOrder
      ? {
          supplierId: purchaseOrder.supplier.id,
          currency: purchaseOrder.currency,
          exchangeRateToBase: String(purchaseOrder.exchangeRateToBase),
          expectedArrival: purchaseOrder.expectedArrival ? purchaseOrder.expectedArrival.slice(0, 10) : '',
          notes: purchaseOrder.notes ?? '',
          items: purchaseOrder.items.map((item) => ({
            productId: item.productId,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          })),
        }
      : {
          supplierId: '',
          currency: 'USD',
          exchangeRateToBase: '1',
          expectedArrival: '',
          notes: '',
          items: [{ productId: '', quantity: '1', unitPrice: '0' }],
        },
  });

  const supplierId = form.watch('supplierId');
  const currency = form.watch('currency') || 'USD';

  // Convenience: default the currency to the selected supplier's own currency (only in create mode, and only until the user edits it themselves).
  useEffect(() => {
    if (mode !== 'create') return;
    const supplier = suppliersQuery.data?.data.find((s) => s.id === supplierId);
    if (supplier && !form.formState.dirtyFields.currency) {
      form.setValue('currency', supplier.currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the selected supplier changes
  }, [supplierId, suppliersQuery.data]);

  const supplierOptions = (suppliersQuery.data?.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.name} (${s.country})`,
  }));

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
        <SelectFormField
          control={form.control}
          name="supplierId"
          label="Supplier"
          placeholder={suppliersQuery.isLoading ? 'Loading suppliers...' : 'Select a supplier'}
          options={supplierOptions}
          disabled={mode === 'edit' || isSubmitting}
        />
        <TextFormField
          control={form.control}
          name="expectedArrival"
          label="Expected Arrival"
          type="date"
          disabled={isSubmitting}
        />
        <TextFormField
          control={form.control}
          name="currency"
          label="Currency"
          placeholder="USD"
          description="3-letter ISO code"
          disabled={isSubmitting}
        />
        <TextFormField
          control={form.control}
          name="exchangeRateToBase"
          label="Exchange Rate to Base"
          type="number"
          placeholder="1.00"
          disabled={isSubmitting}
        />
      </FieldGroup>

      <TextareaFormField control={form.control} name="notes" label="Notes" disabled={isSubmitting} />

      <div className="space-y-2">
        <p className="text-sm font-medium">Line Items</p>
        <PoLineItems
          control={form.control}
          watch={form.watch}
          products={productsQuery.data?.data ?? []}
          currency={currency}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
