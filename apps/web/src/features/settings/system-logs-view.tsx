'use client';

import { useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { SettingsPageShell } from './settings-nav';
import { systemLogColumns } from './system-logs-columns';
import { useSystemLogs } from './hooks';

/**
 * Read-only audit trail — `GET /settings/system-logs` currently always
 * returns an empty page since nothing in the API writes to the `AuditLog`
 * table yet (a known, separate gap tracked in `IMPLEMENTATION_PLAN.md`
 * Phase 3.9, not something this module fixes). Mirrors
 * `features/tax/audit-log-view.tsx`, the first module to hit this same gap:
 * built to render real rows once something starts writing audit entries,
 * with a clear, honest empty state in the meantime rather than implying the
 * feature is broken.
 */
export function SystemLogsView() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const query = useSystemLogs({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  return (
    <SettingsPageShell title="System Logs" description="An audit trail of actions taken across the system, most recent first.">
      <DataTable
        columns={systemLogColumns}
        data={query.data?.data ?? []}
        rowCount={query.data?.pagination.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={query.isLoading}
        emptyTitle="No system log entries yet"
        emptyDescription="Nothing has written to the audit log in this demo yet — entries will appear here once actions start being recorded."
        getRowId={(row) => row.id}
      />
    </SettingsPageShell>
  );
}
