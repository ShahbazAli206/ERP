'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { warehouseSchema, type WarehouseFormValues } from './schemas';
import { useCreateWarehouse, useUpdateWarehouse } from './hooks';
import type { Warehouse } from './api';

const CREATE_DEFAULTS: WarehouseFormValues = { name: '', location: '' };

export function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present => edit mode; absent => create mode. */
  warehouse?: Warehouse;
}) {
  const isEditMode = Boolean(warehouse);
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(warehouse ? { name: warehouse.name, location: warehouse.location ?? '' } : CREATE_DEFAULTS);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/warehouse change
  }, [open, warehouse]);

  const onSubmit = (values: WarehouseFormValues) => {
    const input = { name: values.name, location: values.location || undefined };
    const handlers = {
      onSuccess: () => {
        toast.success(isEditMode ? 'Warehouse updated' : 'Warehouse created');
        onOpenChange(false);
      },
    };
    if (isEditMode && warehouse) {
      updateMutation.mutate({ id: warehouse.id, input }, handlers);
    } else {
      createMutation.mutate(input, handlers);
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
          <DialogTitle>{isEditMode ? 'Edit warehouse' : 'New warehouse'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this warehouse’s details.' : 'Add a new storage location.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField control={form.control} name="name" label="Name" placeholder="Main Warehouse" disabled={mutation.isPending} />
            <TextFormField
              control={form.control}
              name="location"
              label="Location"
              placeholder="Optional — e.g. Karachi Port Zone"
              disabled={mutation.isPending}
            />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t save warehouse</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {isEditMode ? 'Save changes' : 'Create warehouse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
