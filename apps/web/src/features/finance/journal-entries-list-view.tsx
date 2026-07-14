'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { useAuth } from '@/features/auth/use-auth';
import { FinancePageShell } from './finance-nav';
import { journalEntryColumns } from './journal-entry-columns';
import { useJournalEntries } from './hooks';

export function JournalEntriesListView() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('finance:create');

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'entryDate', desc: true }]);

  const sortBy = (sorting[0]?.id as 'entryDate' | 'createdAt' | undefined) ?? 'entryDate';
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';

  const query = useJournalEntries({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy,
    sortOrder,
  });

  return (
    <FinancePageShell
      title="Journal Entries"
      description="Double-entry postings to the general ledger — debits must equal credits on every entry."
      actions={
        canCreate && (
          <Button onClick={() => router.push('/finance/journal-entries/new')}>
            <PlusIcon />
            New Journal Entry
          </Button>
        )
      }
    >
      <DataTable
        columns={journalEntryColumns}
        data={query.data?.data ?? []}
        rowCount={query.data?.pagination.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={query.isLoading}
        emptyTitle="No journal entries yet"
        emptyDescription="Create a journal entry to start recording ledger postings."
        getRowId={(row) => row.id}
      />
    </FinancePageShell>
  );
}
