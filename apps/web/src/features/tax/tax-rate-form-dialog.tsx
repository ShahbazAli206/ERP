'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { CheckboxFormField, SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TAX_TYPE_OPTIONS, taxRateFormSchema, type TaxRateFormInput, type TaxRateFormValues } from './schemas';
import { useCreateTaxRate, useUpdateTaxRate } from './hooks';
import type { TaxRate } from './api';

const CREATE_DEFAULTS: TaxRateFormInput = {
  name: '',
  type: 'GST',
  rate: 0,
  appliesTo: '',
  isActive: true,
};

/**
 * Create/edit dialog for a tax rate. Unlike suppliers (whose edit form needs a separate fetch for
 * `address`), the tax rates list already returns every field a tax rate has, so `editingTax` is
 * passed directly from the row the user clicked — no extra `GET /tax/:id` round trip (the API
 * doesn't expose one; `tax.routes.ts` only has list/create/update/delete + the three
 * dashboard/e-invoice/audit-log reads).
 */
export function TaxRateFormDialog({
  open,
  onOpenChange,
  editingTax,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTax?: TaxRate | null;
}) {
  const isEditMode = Boolean(editingTax);
  const createMutation = useCreateTaxRate();
  const updateMutation = useUpdateTaxRate();

  const form = useForm<TaxRateFormInput, unknown, TaxRateFormValues>({
    resolver: zodResolver(taxRateFormSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    if (editingTax) {
      form.reset({
        name: editingTax.name,
        type: editingTax.type,
        rate: editingTax.rate,
        appliesTo: editingTax.appliesTo ?? '',
        isActive: editingTax.isActive,
      });
    } else {
      form.reset(CREATE_DEFAULTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/editingTax change, not on every form identity change
  }, [open, editingTax]);

  const mutation = isEditMode ? updateMutation : createMutation;

  const onSubmit = (values: TaxRateFormValues) => {
    const payload = {
      name: values.name,
      type: values.type,
      rate: values.rate,
      appliesTo: values.appliesTo ? values.appliesTo : undefined,
      isActive: values.isActive,
    };

    if (isEditMode && editingTax) {
      updateMutation.mutate(
        { id: editingTax.id, input: payload },
        {
          onSuccess: () => {
            toast.success('Tax rate updated');
            onOpenChange(false);
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Tax rate created');
          onOpenChange(false);
        },
      });
    }
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.isError ? 'Something went wrong. Please try again.' : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) mutation.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit tax rate' : 'Create tax rate'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this tax rate’s details.' : 'Add a new GST, sales tax, or withholding tax rate.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField
              control={form.control}
              name="name"
              label="Name"
              placeholder="Standard GST"
              disabled={mutation.isPending}
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectFormField
                control={form.control}
                name="type"
                label="Type"
                options={TAX_TYPE_OPTIONS}
                disabled={mutation.isPending}
              />
              <TextFormField
                control={form.control}
                name="rate"
                label="Rate (%)"
                type="number"
                placeholder="17"
                disabled={mutation.isPending}
              />
            </div>
            <TextFormField
              control={form.control}
              name="appliesTo"
              label="Applies to"
              placeholder="Optional — e.g. Domestic sales"
              disabled={mutation.isPending}
            />
            <CheckboxFormField
              control={form.control}
              name="isActive"
              label="Active"
              description="Only active tax rates are used in compliance-dashboard estimates."
              disabled={mutation.isPending}
            />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t save tax rate</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {isEditMode ? 'Save changes' : 'Create tax rate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
