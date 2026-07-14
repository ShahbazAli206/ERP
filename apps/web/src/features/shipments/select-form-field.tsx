'use client';

import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SelectFieldOption } from '@/components/shared/form-fields';

/**
 * Module-scoped stand-in for `@/components/shared/form-fields`'s `SelectFormField`.
 *
 * Base UI's `<Select.Root>` only renders the closed trigger's label correctly
 * when given an `items` prop (`{ value, label }[]`) — without it,
 * `<Select.Value>` falls back to the raw stored `value` once the popup (and
 * its `<Select.Item>` children) unmounts, e.g. showing a raw product cuid or
 * the `"none"` sentinel instead of "Standalone shipment (no PO)". Confirmed
 * live: the shared `SelectFormField` (`src/components/shared/form-fields.tsx`)
 * and the raw `<Select>` wrapper (`src/components/ui/select.tsx`) don't pass
 * `items` through, so every `<Select>` in the app currently shows the raw
 * value once closed. That's a shared-file fix (one line: `items={options}`
 * on the `<Select>` in both places) — out of bounds for this module, so this
 * local copy adds it instead. Worth reconciling into the shared component.
 */
export function ShipmentSelectFormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  placeholder = 'Select an option',
  options,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  options: SelectFieldOption[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Select disabled={disabled} value={field.value ?? ''} onValueChange={field.onChange} items={options}>
            <SelectTrigger id={field.name} aria-invalid={fieldState.invalid || undefined} className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}
