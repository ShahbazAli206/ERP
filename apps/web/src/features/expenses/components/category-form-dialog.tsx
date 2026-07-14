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
import { expenseCategorySchema, type ExpenseCategoryFormValues } from '../schemas';
import { useCreateExpenseCategory, useUpdateExpenseCategory } from '../hooks';
import type { ExpenseCategory } from '../api';

const CREATE_DEFAULTS: ExpenseCategoryFormValues = { name: '' };

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present => edit mode; absent => create mode. */
  category?: ExpenseCategory;
}) {
  const isEditMode = Boolean(category);
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(category ? { name: category.name } : CREATE_DEFAULTS);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/category change
  }, [open, category]);

  const onSubmit = (values: ExpenseCategoryFormValues) => {
    const handlers = {
      onSuccess: () => {
        toast.success(isEditMode ? 'Category updated' : 'Category created');
        onOpenChange(false);
      },
    };
    if (isEditMode && category) {
      updateMutation.mutate({ id: category.id, input: values }, handlers);
    } else {
      createMutation.mutate(values, handlers);
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
          <DialogTitle>{isEditMode ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this expense category’s name.' : 'Add a new expense category, e.g. Office Expenses, Marketing, Utilities.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField control={form.control} name="name" label="Name" placeholder="Office Expenses" disabled={mutation.isPending} />
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
