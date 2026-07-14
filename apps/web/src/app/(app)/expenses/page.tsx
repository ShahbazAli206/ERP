'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/use-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ExpensesPageShell } from '@/features/expenses/components/expenses-nav';
import { ExpenseFilters } from '@/features/expenses/components/expense-filters';
import { expenseColumns } from '@/features/expenses/components/expense-columns';
import { useExpenses } from '@/features/expenses/hooks';

export default function ExpensesPage() {
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const query = useExpenses({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  return (
    <ExpensesPageShell
      title="Expenses"
      description="Record and track expenses across categories, with attachments and category reports."
      actions={
        hasPermission('expenses:create') ? (
          <Link href="/expenses/new" className={cn(buttonVariants({ size: 'sm' }))}>
            <PlusIcon /> Create Expense
          </Link>
        ) : undefined
      }
    >
      <div className="mt-6 space-y-4">
        <ExpenseFilters
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          from={from}
          onFromChange={setFrom}
          to={to}
          onToChange={setTo}
        />

        <DataTable
          columns={expenseColumns}
          data={query.data?.data ?? []}
          rowCount={query.data?.pagination.total ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by description..."
          isLoading={query.isLoading}
          emptyTitle="No expenses"
          emptyDescription="Try adjusting your filters, or record a new expense."
          getRowId={(row) => row.id}
        />
      </div>
    </ExpensesPageShell>
  );
}
