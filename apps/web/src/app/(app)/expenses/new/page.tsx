'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useCreateExpense } from '@/features/expenses/hooks';
import type { ExpenseFormValues } from '@/features/expenses/schemas';

export default function NewExpensePage() {
  const router = useRouter();
  const createMutation = useCreateExpense();

  function handleSubmit(values: ExpenseFormValues) {
    createMutation.mutate(
      {
        categoryId: values.categoryId,
        amount: Number(values.amount),
        expenseDate: new Date(values.expenseDate).toISOString(),
        description: values.description || undefined,
      },
      {
        onSuccess: (expense) => router.push(`/expenses/${expense.id}`),
      },
    );
  }

  return (
    <>
      <PageHeader title="Create Expense" description="Attachments can be added once the expense is recorded." />
      <div className="mt-6 max-w-2xl">
        <ExpenseForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} submitLabel="Record expense" />
      </div>
    </>
  );
}
