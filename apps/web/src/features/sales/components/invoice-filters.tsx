'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '../status';

const ALL = '__all__';

export function InvoiceFilters({
  status,
  onStatusChange,
}: {
  status: string;
  onStatusChange: (value: string) => void;
}) {
  // `items` is required, not cosmetic — Base UI's <Select.Value> uses it to resolve the
  // closed-trigger label; without it the trigger falls back to the raw stored value once
  // the popup (and its <SelectItem> children) unmounts.
  const statusItems = [
    { value: ALL, label: 'All statuses' },
    ...INVOICE_STATUSES.map((s) => ({ value: s, label: INVOICE_STATUS_LABELS[s] })),
  ];

  return (
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
        {INVOICE_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {INVOICE_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
