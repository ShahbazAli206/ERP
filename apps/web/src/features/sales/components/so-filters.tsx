'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDistributorsForSelect } from '../hooks';
import { SO_STATUSES, STATUS_LABELS } from '../status';

const ALL = '__all__';

export function SoFilters({
  status,
  onStatusChange,
  distributorId,
  onDistributorChange,
}: {
  status: string;
  onStatusChange: (value: string) => void;
  distributorId: string;
  onDistributorChange: (value: string) => void;
}) {
  const distributorsQuery = useDistributorsForSelect();

  // `items` is required, not cosmetic — Base UI's <Select.Value> uses it to resolve the
  // closed-trigger label; without it the trigger falls back to the raw stored value once
  // the popup (and its <SelectItem> children) unmounts.
  const statusItems = [
    { value: ALL, label: 'All statuses' },
    ...SO_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ];
  const distributorItems = [
    { value: ALL, label: 'All distributors' },
    ...(distributorsQuery.data?.data ?? []).map((d) => ({ value: d.id, label: d.name })),
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
          {SO_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={distributorItems}
        value={distributorId || ALL}
        onValueChange={(value) => onDistributorChange(value && value !== ALL ? value : '')}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="All distributors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All distributors</SelectItem>
          {(distributorsQuery.data?.data ?? []).map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
