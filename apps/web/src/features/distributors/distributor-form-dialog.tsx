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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckboxFormField,
  SelectFormField,
  TextareaFormField,
  TextFormField,
} from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { distributorFormSchema, type DistributorFormInput, type DistributorFormValues } from './schemas';
import { useCreateDistributor, useDistributor, useUpdateDistributor } from './hooks';
import { usePricingGroups } from './pricing-groups-hooks';

const NO_PRICING_GROUP = '__none__';

const CREATE_DEFAULTS: DistributorFormInput = {
  name: '',
  region: '',
  creditLimit: '0' as unknown as number,
  pricingGroupId: NO_PRICING_GROUP,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  isActive: true,
};

/**
 * Create/edit dialog for a distributor. `distributorId` present => edit
 * mode: the dialog fetches the full profile (needed for fields the list
 * row's data doesn't include) and pre-fills the form once it loads.
 * `distributorId` absent => create mode, blank form. Mirrors
 * `features/suppliers/supplier-form-dialog.tsx`, with the numeric
 * `creditLimit` field and `pricingGroupId` select following
 * `features/inventory/product-form-dialog.tsx`'s pattern (coerced number +
 * a "none" sentinel select option).
 */
export function DistributorFormDialog({
  open,
  onOpenChange,
  distributorId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distributorId?: string;
  onSuccess?: () => void;
}) {
  const isEditMode = Boolean(distributorId);
  const distributorQuery = useDistributor(distributorId, { enabled: open && isEditMode });
  const pricingGroupsQuery = usePricingGroups();
  const createMutation = useCreateDistributor();
  const updateMutation = useUpdateDistributor();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<DistributorFormInput, unknown, DistributorFormValues>({
    resolver: zodResolver(distributorFormSchema),
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
    if (distributorQuery.data) {
      const d = distributorQuery.data;
      form.reset({
        name: d.name,
        region: d.region,
        creditLimit: d.creditLimit,
        pricingGroupId: d.pricingGroup?.id ?? NO_PRICING_GROUP,
        contactName: d.contactName ?? '',
        contactEmail: d.contactEmail ?? '',
        contactPhone: d.contactPhone ?? '',
        address: d.address ?? '',
        isActive: d.isActive,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/data change, not on every form identity change
  }, [open, isEditMode, distributorQuery.data]);

  const onSubmit = (values: DistributorFormValues) => {
    const payload = {
      name: values.name,
      region: values.region,
      creditLimit: values.creditLimit,
      pricingGroupId: values.pricingGroupId === NO_PRICING_GROUP ? undefined : values.pricingGroupId,
      contactName: values.contactName || undefined,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
      address: values.address || undefined,
      isActive: values.isActive,
    };

    if (isEditMode && distributorId) {
      updateMutation.mutate(
        { id: distributorId, input: payload },
        {
          onSuccess: () => {
            toast.success('Distributor updated');
            onOpenChange(false);
            onSuccess?.();
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Distributor created');
          onOpenChange(false);
          onSuccess?.();
        },
      });
    }
  };

  const isLoadingProfile = isEditMode && distributorQuery.isLoading;
  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'Something went wrong. Please try again.'
        : null;

  const pricingGroupOptions = [
    { value: NO_PRICING_GROUP, label: 'No pricing group' },
    ...(pricingGroupsQuery.data ?? []).map((g) => ({ value: g.id, label: `${g.name} (${g.discountPercent}% off)` })),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) mutation.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit distributor' : 'Create distributor'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this distributor’s details.' : 'Add a new distributor to the system.'}
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
            <ScrollArea className="max-h-[65vh] pr-3">
              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <TextFormField
                    control={form.control}
                    name="name"
                    label="Name"
                    placeholder="Karachi Traders Hub"
                    disabled={mutation.isPending}
                  />
                  <TextFormField
                    control={form.control}
                    name="region"
                    label="Region"
                    placeholder="Karachi"
                    disabled={mutation.isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextFormField
                    control={form.control}
                    name="creditLimit"
                    label="Credit limit"
                    type="number"
                    disabled={mutation.isPending}
                  />
                  <SelectFormField
                    control={form.control}
                    name="pricingGroupId"
                    label="Pricing group"
                    options={pricingGroupOptions}
                    disabled={mutation.isPending || pricingGroupsQuery.isLoading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextFormField
                    control={form.control}
                    name="contactName"
                    label="Contact name"
                    placeholder="Optional"
                    disabled={mutation.isPending}
                  />
                  <TextFormField
                    control={form.control}
                    name="contactEmail"
                    label="Contact email"
                    type="email"
                    placeholder="Optional"
                    disabled={mutation.isPending}
                  />
                </div>
                <TextFormField
                  control={form.control}
                  name="contactPhone"
                  label="Contact phone"
                  placeholder="Optional"
                  disabled={mutation.isPending}
                />
                <TextareaFormField
                  control={form.control}
                  name="address"
                  label="Address"
                  placeholder="Optional"
                  rows={2}
                  disabled={mutation.isPending}
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
            </ScrollArea>

            {errorMessage && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t save distributor</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner />}
                {isEditMode ? 'Save changes' : 'Create distributor'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
