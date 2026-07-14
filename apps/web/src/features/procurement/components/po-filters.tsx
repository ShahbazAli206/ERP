'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliersForSelect } from '../hooks';
import { PO_STATUSES, STATUS_LABELS } from '../status';

const ALL = '__all__';

export function PoFilters({
  status,
  onStatusChange,
  supplierId,
  onSupplierChange,
}: {
  status: string;
  onStatusChange: (value: string) => void;
  supplierId: string;
  onSupplierChange: (value: string) => void;
}) {
  const suppliersQuery = useSuppliersForSelect();

  // `items` is required, not cosmetic — Base UI's <Select.Value> uses it to resolve the
  // closed-trigger label; without it the trigger falls back to the raw stored value once
  // the popup (and its <SelectItem> children) unmounts.
  const statusItems = [
    { value: ALL, label: 'All statuses' },
    ...PO_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ];
  const supplierItems = [
    { value: ALL, label: 'All suppliers' },
    ...(suppliersQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        items={statusItems}
        value={status || ALL}
        onValueChange={(value) => onStatusChange(value && value !== ALL ? value : '')}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {PO_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={supplierItems}
        value={supplierId || ALL}
        onValueChange={(value) => onSupplierChange(value && value !== ALL ? value : '')}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="All suppliers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All suppliers</SelectItem>
          {(suppliersQuery.data?.data ?? []).map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
