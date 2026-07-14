'use client';

import { Controller, useFieldArray, type Control, type UseFormSetValue, type UseFormWatch } from 'react-hook-form';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextFormField } from '@/components/shared/form-fields';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProductOption } from '../api';
import { formatMoney } from '../format';
import type { SalesOrderFormValues } from '../schemas';

/**
 * Volume discount tier thresholds, mirrored from `shared/pricing.ts`'s
 * `VOLUME_DISCOUNT_TIERS` purely to flag "this line qualifies" as a hint next
 * to the quantity input — the actual discount math (item + pricing-group +
 * volume, summed and capped) stays server-computed; this file never derives
 * a total from it.
 */
function volumeTierHint(quantity: number): string | null {
  if (quantity >= 100) return '+5% volume discount applies';
  if (quantity >= 50) return '+2.5% volume discount applies';
  return null;
}

/**
 * Repeatable product/quantity/unit-price/discount line-item builder for the
 * sales order create form. Each row is `items.<index>.<field>` — a normal RHF
 * field array, structurally mirroring Procurement's `po-line-items.tsx` with
 * an added per-item `discount` column and a product-select-driven unit-price
 * prefill (selecting a product fills in its selling price unless the user has
 * already edited that field).
 */
export function SoLineItems({
  control,
  watch,
  setValue,
  products,
  currency,
  disabled,
}: {
  control: Control<SalesOrderFormValues>;
  watch: UseFormWatch<SalesOrderFormValues>;
  setValue: UseFormSetValue<SalesOrderFormValues>;
  products: ProductOption[];
  currency: string;
  disabled?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));
  // Raw, pre-discount subtotal shown only as a rough reference — the real total (with item +
  // pricing-group + volume discounts stacked) is always server-computed; see the order detail
  // page after submit for the authoritative figure.
  const grandSubtotal =
    items?.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0) ?? 0;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Product</TableHead>
              <TableHead className="w-28">Quantity</TableHead>
              <TableHead className="w-36">Unit Price</TableHead>
              <TableHead className="w-32">Discount %</TableHead>
              <TableHead className="w-32 text-right">Line Subtotal</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const row = items?.[index];
              const quantity = Number(row?.quantity) || 0;
              const subtotal = quantity * (Number(row?.unitPrice) || 0);
              const hint = volumeTierHint(quantity);
              return (
                <TableRow key={field.id}>
                  <TableCell className="align-top">
                    <Controller
                      control={control}
                      name={`items.${index}.productId`}
                      render={({ field: productField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined} className="gap-0">
                          <Select
                            disabled={disabled}
                            value={productField.value ?? ''}
                            items={productOptions}
                            onValueChange={(value) => {
                              productField.onChange(value);
                              // Prefill the unit price from the product's selling price, but only
                              // if the user hasn't already typed their own price for this row.
                              const dirty = control._formState.dirtyFields.items?.[index]?.unitPrice;
                              if (!dirty) {
                                const product = products.find((p) => p.id === value);
                                if (product) {
                                  setValue(`items.${index}.unitPrice`, String(product.sellingPrice));
                                }
                              }
                            }}
                          >
                            <SelectTrigger aria-invalid={fieldState.invalid || undefined} className="w-full">
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {productOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                        </Field>
                      )}
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
                    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
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
                  <TableCell className="align-top">
                    <TextFormField
                      control={control}
                      name={`items.${index}.discount`}
                      label=""
                      className="gap-0"
                      type="number"
                      placeholder="0"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="pt-2.5 text-right align-top text-sm tabular-nums">
                    {formatMoney(subtotal, currency)}
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
          onClick={() => append({ productId: '', quantity: '1', unitPrice: '0', discount: '0' })}
        >
          <PlusIcon /> Add line item
        </Button>
        <p className="text-sm">
          <span className="text-muted-foreground">Subtotal before discounts: </span>
          <span className="font-medium tabular-nums">{formatMoney(grandSubtotal, currency)}</span>
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        This is a rough pre-discount figure. The real total — item discount + distributor pricing-group
        discount + automatic volume discount, stacked and capped at 100% — is computed by the server and
        shown on the order detail page once created.
      </p>
    </div>
  );
}
