'use client';

import { useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { useAuditLogs } from './hooks';
import { auditLogColumns } from './audit-log-columns';

/**
 * Read-only audit log list — `GET /tax/audit-logs` currently always returns an empty page since
 * nothing in the API writes to the `AuditLog` table yet (a known separate gap, not something this
 * module fixes). Built so it renders real rows once something starts writing audit entries; for
 * now it just shows a clear, honest empty state instead of implying the feature is broken.
 */
export function AuditLogView() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const query = useAuditLogs({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  return (
    <DataTable
      columns={auditLogColumns}
      data={query.data?.data ?? []}
      rowCount={query.data?.pagination.total ?? 0}
      pagination={pagination}
      onPaginationChange={setPagination}
      isLoading={query.isLoading}
      emptyTitle="No audit log entries yet"
      emptyDescription="Nothing has written to the audit log in this demo yet — entries will appear here once actions start being recorded."
      getRowId={(row) => row.id}
    />
  );
}
