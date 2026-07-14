'use client';

import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Reusable RHF + shadcn form field wrappers.
 *
 * ── The standard form convention for this app ────────────────────────────
 * Every form follows the same recipe:
 *
 *   1. Define a Zod schema (co-located per feature, e.g.
 *      `src/features/auth/schemas.ts`) and derive its type with `z.infer`.
 *   2. `const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues })`.
 *   3. Render fields with the wrappers below, passing `form.control`.
 *   4. `form.handleSubmit(onSubmit)` on the `<form>` element; wire `onSubmit`
 *      to a React Query `useMutation` (see `src/features/auth/*` /
 *      `login-form.tsx` for the complete reference example).
 *
 * Note: shadcn's registry no longer ships the old `Form`/`FormField`
 * (react-hook-form-bound) component in this version — it now ships a
 * layout-only `Field`/`FieldLabel`/`FieldDescription`/`FieldError` primitive
 * (`src/components/ui/field.tsx`) with no built-in form-library binding.
 * These wrappers are the RHF binding layer on top of that primitive, so
 * every module gets the one-line-per-field ergonomics the old `FormField`
 * used to provide, e.g.:
 *
 *   <TextFormField control={form.control} name="email" label="Email" type="email" />
 * ──────────────────────────────────────────────────────────────────────
 */

interface BaseFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function TextFormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  type = 'text',
  placeholder,
  autoComplete,
}: BaseFieldProps<TFieldValues> & {
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            aria-invalid={fieldState.invalid || undefined}
            {...field}
            value={field.value ?? ''}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export function TextareaFormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  placeholder,
  rows = 4,
}: BaseFieldProps<TFieldValues> & { placeholder?: string; rows?: number }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Textarea
            id={field.name}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            aria-invalid={fieldState.invalid || undefined}
            {...field}
            value={field.value ?? ''}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export interface SelectFieldOption {
  value: string;
  label: string;
}

export function SelectFormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  placeholder = 'Select an option',
  options,
}: BaseFieldProps<TFieldValues> & { placeholder?: string; options: SelectFieldOption[] }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          {/* `items` is required, not cosmetic — Base UI's <Select.Value> uses it to resolve the
              closed-trigger label; without it the trigger falls back to the raw stored value once
              the popup (and its <SelectItem> children) unmounts. */}
          <Select
            disabled={disabled}
            value={field.value ?? ''}
            onValueChange={field.onChange}
            items={options}
          >
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

export function CheckboxFormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: BaseFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} orientation="horizontal" className={className}>
          <Checkbox
            id={field.name}
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
            disabled={disabled}
            aria-invalid={fieldState.invalid || undefined}
          />
          <FieldLabel htmlFor={field.name} className="font-normal">
            {label}
          </FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}
