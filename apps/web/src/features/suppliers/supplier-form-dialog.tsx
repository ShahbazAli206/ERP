'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { CheckboxFormField, TextFormField, TextareaFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { supplierFormSchema, type SupplierFormValues } from './schemas';
import { useCreateSupplier, useSupplier, useUpdateSupplier } from './hooks';

const CREATE_DEFAULTS: SupplierFormValues = {
  name: '',
  country: '',
  currency: '',
  address: '',
  isActive: true,
};

/**
 * Create/edit dialog for a supplier. `supplierId` present => edit mode: the
 * dialog fetches the full profile (needed for `address`, which the list
 * page's row data doesn't include) and pre-fills the form once it loads.
 * `supplierId` absent => create mode, blank form.
 */
export function SupplierFormDialog({
  open,
  onOpenChange,
  supplierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId?: string;
  onSuccess?: () => void;
}) {
  const isEditMode = Boolean(supplierId);
  const supplierQuery = useSupplier(supplierId, { enabled: open && isEditMode });
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  // Re-populate the form whenever the dialog opens: blank for create, from
  // the fetched profile for edit (once it arrives).
  useEffect(() => {
    if (!open) return;
    if (!isEditMode) {
      form.reset(CREATE_DEFAULTS);
      return;
    }
    if (supplierQuery.data) {
      form.reset({
        name: supplierQuery.data.name,
        country: supplierQuery.data.country,
        currency: supplierQuery.data.currency,
        address: supplierQuery.data.address ?? '',
        isActive: supplierQuery.data.isActive,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/data change, not on every form identity change
  }, [open, isEditMode, supplierQuery.data]);

  const mutation = isEditMode ? updateMutation : createMutation;

  const onSubmit = (values: SupplierFormValues) => {
    const payload = {
      name: values.name,
      country: values.country,
      currency: values.currency.toUpperCase(),
      address: values.address ? values.address : undefined,
      isActive: values.isActive,
    };

    if (isEditMode && supplierId) {
      updateMutation.mutate(
        { id: supplierId, input: payload },
        {
          onSuccess: () => {
            toast.success('Supplier updated');
            onOpenChange(false);
            onSuccess?.();
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Supplier created');
          onOpenChange(false);
          onSuccess?.();
        },
      });
    }
  };

  const isLoadingProfile = isEditMode && supplierQuery.isLoading;
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
          <DialogTitle>{isEditMode ? 'Edit supplier' : 'Create supplier'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this supplier’s details.' : 'Add a new supplier to the system.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingProfile ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FieldGroup>
              <TextFormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Acme Trading Co."
                disabled={mutation.isPending}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextFormField
                  control={form.control}
                  name="country"
                  label="Country"
                  placeholder="Singapore"
                  disabled={mutation.isPending}
                />
                <TextFormField
                  control={form.control}
                  name="currency"
                  label="Currency"
                  placeholder="USD"
                  disabled={mutation.isPending}
                />
              </div>
              <TextareaFormField
                control={form.control}
                name="address"
                label="Address"
                placeholder="Optional"
                disabled={mutation.isPending}
                rows={2}
              />
              {isEditMode && (
                <CheckboxFormField
                  control={form.control}
                  name="isActive"
                  label="Active"
                  description="Uncheck to deactivate without using the dedicated Deactivate action."
                  disabled={mutation.isPending}
                />
              )}
            </FieldGroup>

            {errorMessage && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t save supplier</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner />}
                {isEditMode ? 'Save changes' : 'Create supplier'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
