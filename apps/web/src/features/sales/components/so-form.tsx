'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FieldGroup } from '@/components/ui/field';
import { SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { useDistributorsForSelect, useProductsForSelect } from '../hooks';
import { salesOrderFormSchema, type SalesOrderFormValues } from '../schemas';
import { SoLineItems } from './so-line-items';

/**
 * Sales order create form. Editing an existing order (`PATCH /sales/orders/:id`)
 * is only ever valid while it's DRAFT, but this app doesn't expose an edit
 * page for sales orders — a draft order can be cancelled and recreated, which
 * is simpler than mirroring Procurement's separate `/edit` route for a form
 * this module doesn't currently need.
 */
export function SoForm({
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  onSubmit: (values: SalesOrderFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const distributorsQuery = useDistributorsForSelect();
  const productsQuery = useProductsForSelect();

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderFormSchema),
    defaultValues: {
      distributorId: '',
      currency: 'PKR',
      discountPercent: '0',
      items: [{ productId: '', quantity: '1', unitPrice: '0', discount: '0' }],
    },
  });

  const currency = form.watch('currency') || 'PKR';

  const distributorOptions = (distributorsQuery.data?.data ?? []).map((d) => ({
    value: d.id,
    label: `${d.name} (${d.region})`,
  }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
        <SelectFormField
          control={form.control}
          name="distributorId"
          label="Distributor"
          placeholder={distributorsQuery.isLoading ? 'Loading distributors...' : 'Select a distributor'}
          options={distributorOptions}
          disabled={isSubmitting}
        />
        <TextFormField
          control={form.control}
          name="currency"
          label="Currency"
          placeholder="PKR"
          description="3-letter ISO code"
          disabled={isSubmitting}
        />
        <TextFormField
          control={form.control}
          name="discountPercent"
          label="Order-level Discount %"
          type="number"
          placeholder="0"
          description="Applied on top of each line's item/pricing-group/volume discounts"
          disabled={isSubmitting}
        />
      </FieldGroup>

      <div className="space-y-2">
        <p className="text-sm font-medium">Line Items</p>
        <SoLineItems
          control={form.control}
          watch={form.watch}
          setValue={form.setValue}
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
