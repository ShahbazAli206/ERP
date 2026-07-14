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
import { SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { categorySchema, type CategoryFormValues } from './schemas';
import { useCategories, useCreateCategory, useUpdateCategory } from './hooks';
import type { Category } from './api';

const NO_PARENT = '__none__';
const CREATE_DEFAULTS: CategoryFormValues = { name: '', parentId: NO_PARENT };

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present => edit mode; absent => create mode. */
  category?: Category;
}) {
  const isEditMode = Boolean(category);
  const categoriesQuery = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(category ? { name: category.name, parentId: category.parentId ?? NO_PARENT } : CREATE_DEFAULTS);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/category change
  }, [open, category]);

  const onSubmit = (values: CategoryFormValues) => {
    const input = { name: values.name, parentId: values.parentId === NO_PARENT ? undefined : values.parentId };
    const handlers = {
      onSuccess: () => {
        toast.success(isEditMode ? 'Category updated' : 'Category created');
        onOpenChange(false);
      },
    };
    if (isEditMode && category) {
      updateMutation.mutate({ id: category.id, input }, handlers);
    } else {
      createMutation.mutate(input, handlers);
    }
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.isError ? 'Something went wrong. Please try again.' : null;

  const parentOptions = [
    { value: NO_PARENT, label: 'None (top level)' },
    ...(categoriesQuery.data ?? []).filter((c) => c.id !== category?.id).map((c) => ({ value: c.id, label: c.name })),
  ];

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
          <DialogTitle>{isEditMode ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this category’s details.' : 'Add a new product category.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField control={form.control} name="name" label="Name" placeholder="Electronics" disabled={mutation.isPending} />
            <SelectFormField
              control={form.control}
              name="parentId"
              label="Parent category"
              options={parentOptions}
              disabled={mutation.isPending}
            />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t save category</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {isEditMode ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
