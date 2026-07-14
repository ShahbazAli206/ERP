/**
 * Formatting helpers local to the Expenses module (kept out of `src/lib` per
 * this module's folder boundary). The system's base currency is PKR (see
 * `apps/api/src/modules/settings/companySettings.service.ts` and the
 * dashboard's own `features/dashboard/utils.ts`) — Expense has no per-record
 * currency field, so every amount here is formatted as PKR.
 */

const moneyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 2,
});

const compactMoneyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

export function formatMoneyCompact(amount: number): string {
  return compactMoneyFormatter.format(amount);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
