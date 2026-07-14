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
import { Spinner } from '@/components/ui/spinner';
import { TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { pricingGroupFormSchema, type PricingGroupFormInput, type PricingGroupFormValues } from './pricing-groups-schemas';
import { useCreatePricingGroup, useUpdatePricingGroup } from './pricing-groups-hooks';
import type { PricingGroup } from './pricing-groups-api';

const CREATE_DEFAULTS: PricingGroupFormInput = { name: '', discountPercent: '0' as unknown as number };

/**
 * Create/edit dialog for a pricing group. `pricingGroup` present => edit
 * mode, pre-filled from the row data already loaded on the list page (no
 * separate detail endpoint exists — `pricingGroupsService` only has
 * list/create/update/delete, matching `pricingGroups.routes.ts`). Mirrors
 * `features/inventory/category-form-dialog.tsx`.
 */
export function PricingGroupFormDialog({
  open,
  onOpenChange,
  pricingGroup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pricingGroup?: PricingGroup;
}) {
  const isEditMode = Boolean(pricingGroup);
  const createMutation = useCreatePricingGroup();
  const updateMutation = useUpdatePricingGroup();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<PricingGroupFormInput, unknown, PricingGroupFormValues>({
    resolver: zodResolver(pricingGroupFormSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      pricingGroup ? { name: pricingGroup.name, discountPercent: pricingGroup.discountPercent } : CREATE_DEFAULTS,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/pricingGroup change
  }, [open, pricingGroup]);

  const onSubmit = (values: PricingGroupFormValues) => {
    const input = { name: values.name, discountPercent: values.discountPercent };
    const handlers = {
      onSuccess: () => {
        toast.success(isEditMode ? 'Pricing group updated' : 'Pricing group created');
        onOpenChange(false);
      },
    };
    if (isEditMode && pricingGroup) {
      updateMutation.mutate({ id: pricingGroup.id, input }, handlers);
    } else {
      createMutation.mutate(input, handlers);
    }
  };

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'Something went wrong. Please try again.'
        : null;

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
          <DialogTitle>{isEditMode ? 'Edit pricing group' : 'New pricing group'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update this pricing group’s name or discount.'
              : 'Add a new pricing group distributors can be assigned to.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField
              control={form.control}
              name="name"
              label="Name"
              placeholder="Preferred Partner"
              disabled={mutation.isPending}
            />
            <TextFormField
              control={form.control}
              name="discountPercent"
              label="Discount percent"
              type="number"
              description="Applied to sales orders for distributors in this group."
              disabled={mutation.isPending}
            />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t save pricing group</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {isEditMode ? 'Save changes' : 'Create pricing group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
