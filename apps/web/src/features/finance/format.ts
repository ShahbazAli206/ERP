/** Two-decimal money string, e.g. "1,234,567.89" — every Finance view formats amounts this way. */
export function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Compact axis tick (e.g. "500M") — plain `toLocaleString()` values clip against a fixed-width Y-axis. */
export function formatCompact(value: number): string {
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** `yyyy-mm-dd` for `<input type="date">` defaults. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
