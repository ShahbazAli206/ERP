'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TriangleAlertIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useExpense, useUpdateExpense } from '@/features/expenses/hooks';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import type { ExpenseFormValues } from '@/features/expenses/schemas';

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const query = useExpense(id);
  const updateMutation = useUpdateExpense(id);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Empty className="min-h-[50vh] flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Expense not found</EmptyTitle>
        </EmptyHeader>
        <Link href="/expenses" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Back to Expenses
        </Link>
      </Empty>
    );
  }

  const expense = query.data;

  function handleSubmit(values: ExpenseFormValues) {
    updateMutation.mutate(
      {
        categoryId: values.categoryId,
        amount: Number(values.amount),
        expenseDate: new Date(values.expenseDate).toISOString(),
        description: values.description || undefined,
      },
      {
        onSuccess: () => router.push(`/expenses/${id}`),
      },
    );
  }

  return (
    <>
      <PageHeader title="Edit Expense" description="Attachments are managed from the expense detail page." />
      <div className="mt-6 max-w-2xl">
        <ExpenseForm
          expense={expense}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Save changes"
        />
      </div>
    </>
  );
}
