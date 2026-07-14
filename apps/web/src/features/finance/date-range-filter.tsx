'use client';

import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';

/**
 * Plain `<input type="date">` pair for report date-range filters (Profit &
 * Loss, Cash Flow). Not RHF-bound — these are live filter controls that
 * refetch on change, not a submitted form, so the shared `TextFormField`
 * (which expects a `Control`) doesn't fit; a shadcn `Calendar`/date-picker
 * isn't registered in this repo's `components/ui/` yet, so native date
 * inputs are the simplest correct choice here.
 */
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field className="w-full sm:w-48">
        <FieldLabel htmlFor="date-range-from">From</FieldLabel>
        <Input
          id="date-range-from"
          type="date"
          value={from}
          max={to}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </Field>
      <Field className="w-full sm:w-48">
        <FieldLabel htmlFor="date-range-to">To</FieldLabel>
        <Input id="date-range-to" type="date" value={to} min={from} onChange={(event) => onToChange(event.target.value)} />
      </Field>
    </div>
  );
}
