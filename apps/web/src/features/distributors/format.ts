/**
 * Distributors/pricing groups have no per-record currency field of their own
 * (unlike Suppliers) — credit limit, outstanding balance, and sales-history
 * totals are all in the app's base currency (PKR, per the seed data and
 * Suppliers' profile view precedent). Individual `PaymentHistoryItemDto`
 * rows DO carry their own `currency`, so callers can override the default.
 */
export function formatCurrency(amount: number, currency = 'PKR') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    // Unrecognized currency code — fall back to a plain number so a typo'd seed value never crashes the page.
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
