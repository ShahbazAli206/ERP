'use client';

import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';

/** Plain `<input type="date">` pair for report date-range filters — copied per-module per this repo's convention (see `features/finance/date-range-filter.tsx`). */
export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
      <Field className="w-full sm:w-48">
        <FieldLabel htmlFor="report-date-from">From</FieldLabel>
        <Input
          id="report-date-from"
          type="date"
          value={from}
          max={to}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </Field>
      <Field className="w-full sm:w-48">
        <FieldLabel htmlFor="report-date-to">To</FieldLabel>
        <Input
          id="report-date-to"
          type="date"
          value={to}
          min={from}
          onChange={(event) => onToChange(event.target.value)}
        />
      </Field>
    </div>
  );
}
