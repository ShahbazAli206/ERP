'use client';

import { useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { SettingsPageShell } from './settings-nav';
import { settingsUserColumns } from './users-columns';
import { useSettingsUsers } from './hooks';

/**
 * Read-only user directory. `GET /settings/users` intentionally has no
 * create/edit counterpart — user management isn't in scope for this module
 * (see the backend routes file) — so there's no "New User" action here,
 * unlike every CRUD list elsewhere in this app.
 */
export function UsersView() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const query = useSettingsUsers({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  return (
    <SettingsPageShell title="Users" description="Everyone with an account in this system. Read-only — user creation isn't part of this module.">
      <DataTable
        columns={settingsUserColumns}
        data={query.data?.data ?? []}
        rowCount={query.data?.pagination.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={query.isLoading}
        emptyTitle="No users found"
        emptyDescription="No user accounts exist yet."
        getRowId={(row) => row.id}
      />
    </SettingsPageShell>
  );
}
