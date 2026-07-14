'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PencilIcon, TriangleAlertIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants, Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/use-auth';
import { useDeleteExpense, useExpense } from '@/features/expenses/hooks';
import { AttachmentsSection } from '@/features/expenses/components/attachments-section';
import { ConfirmDialog } from '@/features/expenses/components/confirm-dialog';
import { formatDate, formatDateTime, formatMoney } from '@/features/expenses/format';

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('expenses:edit');
  const canDelete = hasPermission('expenses:delete');

  const query = useExpense(id);
  const deleteMutation = useDeleteExpense();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
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

  return (
    <>
      <PageHeader
        title={formatMoney(expense.amount)}
        description={`${expense.categoryName} · ${formatDate(expense.expenseDate)}`}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/expenses/${expense.id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                <PencilIcon /> Edit
              </Link>
            )}
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon /> Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{expense.categoryName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium tabular-nums">{formatMoney(expense.amount)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Expense Date</span>
              <span className="font-medium">{formatDate(expense.expenseDate)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Recorded By</span>
              <span className="font-medium">{expense.createdByName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Recorded At</span>
              <span className="font-medium">{formatDateTime(expense.createdAt)}</span>
            </div>
            {expense.description && (
              <div className="space-y-1 border-t pt-3">
                <span className="text-muted-foreground">Description</span>
                <p className="font-medium whitespace-pre-wrap">{expense.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <AttachmentsSection expenseId={expense.id} attachments={expense.attachments} />
          </CardContent>
        </Card>
      </div>

      {canDelete && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete this expense?"
          description="This permanently deletes the expense record and its attachments (including the uploaded files)."
          confirmLabel="Delete"
          isPending={deleteMutation.isPending}
          onConfirm={() => {
            deleteMutation.mutate(expense.id, {
              onSuccess: () => router.push('/expenses'),
            });
          }}
        />
      )}
    </>
  );
}
