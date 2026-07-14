'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SelectFormField, TextareaFormField, TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { productSchema, type ProductFormInput, type ProductFormValues } from './schemas';
import { useCategories, useCreateProduct, useProduct, useUpdateProduct } from './hooks';

const NO_CATEGORY = '__none__';

const CREATE_DEFAULTS: ProductFormInput = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  imageUrl: '',
  categoryId: NO_CATEGORY,
  unit: 'pcs',
  costPrice: '0' as unknown as number,
  sellingPrice: '0' as unknown as number,
  reorderLevel: '0' as unknown as number,
};

export function ProductFormDialog({
  open,
  onOpenChange,
  productId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present => edit mode; absent => create mode. */
  productId?: string;
}) {
  const isEditMode = Boolean(productId);
  const categoriesQuery = useCategories();
  const productQuery = useProduct(productId, { enabled: open && isEditMode });
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    if (!isEditMode) {
      form.reset(CREATE_DEFAULTS);
      return;
    }
    if (productQuery.data) {
      const p = productQuery.data;
      form.reset({
        sku: p.sku,
        barcode: p.barcode ?? '',
        name: p.name,
        description: p.description ?? '',
        imageUrl: p.imageUrl ?? '',
        categoryId: p.categoryId ?? NO_CATEGORY,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        reorderLevel: p.reorderLevel,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/data change
  }, [open, isEditMode, productQuery.data]);

  const onSubmit = (values: ProductFormValues) => {
    const input = {
      sku: values.sku,
      barcode: values.barcode || undefined,
      name: values.name,
      description: values.description || undefined,
      imageUrl: values.imageUrl || undefined,
      categoryId: values.categoryId === NO_CATEGORY ? undefined : values.categoryId,
      unit: values.unit,
      costPrice: values.costPrice,
      sellingPrice: values.sellingPrice,
      reorderLevel: values.reorderLevel,
    };

    const handleError = (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        form.setError('sku', { type: 'server', message: error.message });
        return;
      }
      form.setError('root', {
        type: 'server',
        message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    };

    if (isEditMode && productId) {
      updateMutation.mutate(
        { id: productId, input },
        {
          onSuccess: () => {
            toast.success('Product updated');
            onOpenChange(false);
          },
          onError: handleError,
        },
      );
    } else {
      createMutation.mutate(input, {
        onSuccess: () => {
          toast.success('Product created');
          onOpenChange(false);
        },
        onError: handleError,
      });
    }
  };

  const isLoadingProfile = isEditMode && productQuery.isLoading;
  const rootError = form.formState.errors.root?.message;

  const categoryOptions = [
    { value: NO_CATEGORY, label: 'Uncategorized' },
    ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
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
          <DialogTitle>{isEditMode ? 'Edit product' : 'New product'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this product’s catalog details.' : 'Add a new product to the catalog.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingProfile ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <ScrollArea className="max-h-[60vh] pr-3">
              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <TextFormField control={form.control} name="sku" label="SKU" placeholder="ELEC-0001" disabled={mutation.isPending} />
                  <TextFormField control={form.control} name="barcode" label="Barcode" placeholder="Optional" disabled={mutation.isPending} />
                </div>
                <TextFormField control={form.control} name="name" label="Name" placeholder="Wireless Mouse" disabled={mutation.isPending} />
                <TextareaFormField
                  control={form.control}
                  name="description"
                  label="Description"
                  placeholder="Optional"
                  rows={2}
                  disabled={mutation.isPending}
                />
                <TextFormField
                  control={form.control}
                  name="imageUrl"
                  label="Image URL"
                  placeholder="Optional — https://…"
                  disabled={mutation.isPending}
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectFormField
                    control={form.control}
                    name="categoryId"
                    label="Category"
                    options={categoryOptions}
                    disabled={mutation.isPending}
                  />
                  <TextFormField control={form.control} name="unit" label="Unit" placeholder="pcs" disabled={mutation.isPending} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TextFormField
                    control={form.control}
                    name="costPrice"
                    label="Cost price"
                    type="number"
                    disabled={mutation.isPending}
                  />
                  <TextFormField
                    control={form.control}
                    name="sellingPrice"
                    label="Selling price"
                    type="number"
                    disabled={mutation.isPending}
                  />
                  <TextFormField
                    control={form.control}
                    name="reorderLevel"
                    label="Reorder level"
                    type="number"
                    disabled={mutation.isPending}
                  />
                </div>
              </FieldGroup>
            </ScrollArea>

            {rootError && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t save product</AlertTitle>
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner />}
                {isEditMode ? 'Save changes' : 'Create product'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
