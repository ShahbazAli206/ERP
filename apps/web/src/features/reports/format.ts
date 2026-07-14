/** Two-decimal money string, e.g. "1,234,567.89" — every Reports view formats amounts this way. */
export function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** `yyyy-mm-dd` for `<input type="date">` defaults. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfYear(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}
