'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FieldGroup } from '@/components/ui/field';
import { SelectFormField, TextFormField, TextareaFormField } from '@/components/shared/form-fields';
import { useExpenseCategories } from '../hooks';
import { expenseFormSchema, type ExpenseFormValues } from '../schemas';
import type { ExpenseDetail } from '../api';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Shared create/edit form for a single expense. Attachments are managed separately on the expense detail page, once it exists (mirrors Procurement's PO create/edit + attachments-on-detail-page split). */
export function ExpenseForm({
  expense,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  /** Present => edit mode (prefills from the existing expense); absent => create mode. */
  expense?: ExpenseDetail;
  onSubmit: (values: ExpenseFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const categoriesQuery = useExpenseCategories();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: expense
      ? {
          categoryId: expense.categoryId,
          amount: String(expense.amount),
          expenseDate: expense.expenseDate.slice(0, 10),
          description: expense.description ?? '',
        }
      : {
          categoryId: '',
          amount: '',
          expenseDate: todayIsoDate(),
          description: '',
        },
  });

  const categoryOptions = (categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
        <SelectFormField
          control={form.control}
          name="categoryId"
          label="Category"
          placeholder={categoriesQuery.isLoading ? 'Loading categories...' : 'Select a category'}
          options={categoryOptions}
          disabled={isSubmitting}
        />
        <TextFormField
          control={form.control}
          name="expenseDate"
          label="Expense Date"
          type="date"
          disabled={isSubmitting}
        />
        <TextFormField
          control={form.control}
          name="amount"
          label="Amount"
          type="number"
          placeholder="0.00"
          description="Recorded in the system's base currency (PKR)."
          disabled={isSubmitting}
        />
      </FieldGroup>

      <TextareaFormField control={form.control} name="description" label="Description" disabled={isSubmitting} />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
