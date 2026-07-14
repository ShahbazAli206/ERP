/**
 * Formatting helpers local to the AI Dashboard module (kept out of `src/lib` per the per-module
 * folder boundary — see `src/features/tax/format.ts` / `src/features/dashboard/utils.ts` for the
 * same convention).
 */

const compactNumberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const compactCurrencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const mediumDateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}

/** "2026-07" -> "Jul 2026", for demand forecast month axis ticks/tooltips. */
export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-');
  if (!year || !monthNum) return month;
  const date = new Date(Number(year), Number(monthNum) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** "2026-07-31" -> "Jul 31, 2026", for predictive chart date axis ticks/tooltips. */
export function formatDateLabel(value: string): string {
  return shortDateFormatter.format(new Date(value));
}

/** `null` -> "Never sold" for slow-moving inventory's `lastSaleDate`. */
export function formatLastSaleDate(value: string | null): string {
  return value ? mediumDateFormatter.format(new Date(value)) : 'Never sold';
}
