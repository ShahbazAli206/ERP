'use client';

import { useFieldArray, type Control, type UseFormWatch } from 'react-hook-form';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProductOption } from '../api';
import { formatMoney } from '../format';
import type { PurchaseOrderFormValues } from '../schemas';

/**
 * Repeatable product/quantity/unit-price line-item builder for the PO
 * create/edit form. Each row is `items.<index>.<field>` — a normal RHF field
 * array, wired through the same `SelectFormField`/`TextFormField` wrappers
 * every other form in the app uses.
 */
export function PoLineItems({
  control,
  watch,
  products,
  currency,
  disabled,
}: {
  control: Control<PurchaseOrderFormValues>;
  watch: UseFormWatch<PurchaseOrderFormValues>;
  products: ProductOption[];
  currency: string;
  disabled?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));
  const grandTotal = items?.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0) ?? 0;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Product</TableHead>
              <TableHead className="w-28">Quantity</TableHead>
              <TableHead className="w-36">Unit Price</TableHead>
              <TableHead className="w-32 text-right">Line Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const row = items?.[index];
              const lineTotal = (Number(row?.quantity) || 0) * (Number(row?.unitPrice) || 0);
              return (
                <TableRow key={field.id}>
                  <TableCell className="align-top">
                    <SelectFormField
                      control={control}
                      name={`items.${index}.productId`}
                      label=""
                      className="gap-0"
                      placeholder="Select a product"
                      options={productOptions}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <TextFormField
                      control={control}
                      name={`items.${index}.quantity`}
                      label=""
                      className="gap-0"
                      type="number"
                      placeholder="0"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <TextFormField
                      control={control}
                      name={`items.${index}.unitPrice`}
                      label=""
                      className="gap-0"
                      type="number"
                      placeholder="0.00"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="pt-2.5 text-right align-top text-sm tabular-nums">
                    {formatMoney(lineTotal, currency)}
                  </TableCell>
                  <TableCell className="pt-1.5 align-top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={disabled || fields.length === 1}
                      onClick={() => remove(index)}
                      aria-label="Remove line item"
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <FieldError errors={control._formState.errors.items?.message ? [control._formState.errors.items] : undefined} />

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => append({ productId: '', quantity: '1', unitPrice: '0' })}
        >
          <PlusIcon /> Add line item
        </Button>
        <p className="text-sm font-medium">
          Total: <span className="tabular-nums">{formatMoney(grandTotal, currency)}</span>
        </p>
      </div>
    </div>
  );
}
