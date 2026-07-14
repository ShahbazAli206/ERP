'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PaginationState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/features/auth/use-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useShipments } from '@/features/shipments/hooks';
import { shipmentColumns } from '@/features/shipments/columns';
import { SHIPMENT_STATUSES, shipmentStatusLabel } from '@/features/shipments/status';

const ALL_STATUSES = 'ALL';

// Base UI's <Select.Root> only shows the matching item's label in the closed
// trigger when given an `items` prop `{ value, label }[]` — without it,
// `<Select.Value>` falls back to the raw stored value once the popup (and
// its <Select.Item> children) unmounts. See `select-form-field.tsx`'s
// docstring for the full story; this is the same fix for this page's plain
// (non-form) status filter select.
const STATUS_FILTER_ITEMS = [
  { value: ALL_STATUSES, label: 'All statuses' },
  ...SHIPMENT_STATUSES.map((value) => ({ value, label: shipmentStatusLabel(value) })),
];

export default function ShipmentsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(ALL_STATUSES);
  const debouncedSearch = useDebouncedValue(search);

  const query = useShipments({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch,
    status: status === ALL_STATUSES ? undefined : status,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <>
      <PageHeader
        title="Shipments"
        description="Container tracking and landed cost calculations."
        actions={
          hasPermission('shipments:create') && (
            <Button onClick={() => router.push('/shipments/new')}>
              <PlusIcon />
              Create Shipment
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value ?? ALL_STATUSES);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            items={STATUS_FILTER_ITEMS}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              {SHIPMENT_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {shipmentStatusLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={shipmentColumns}
          data={query.data?.data ?? []}
          rowCount={query.data?.pagination.total ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          search={search}
          onSearchChange={(value) => { setSearch(value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
          searchPlaceholder="Search by shipment #..."
          isLoading={query.isLoading}
          emptyTitle="No shipments found"
          emptyDescription="Try adjusting the status filter or search, or create a new shipment."
          getRowId={(row) => row.id}
        />
      </div>
    </>
  );
}
