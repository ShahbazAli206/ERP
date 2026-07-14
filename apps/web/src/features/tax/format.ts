/**
 * Formatting helpers local to the Tax module (kept out of `src/lib` per this module's folder
 * boundary — see `src/features/dashboard/utils.ts` / `src/features/procurement/format.ts` for the
 * same per-module convention). The system's base currency is PKR (see
 * `apps/api/src/modules/settings/companySettings.service.ts` and the seed data); the tax module's
 * amounts (`totalInvoicedAmount`, `estimatedTaxLiability`) are plain un-currency-tagged numbers on
 * the DTO, so PKR is assumed to match every other module's dashboard figures.
 */

const currencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${value % 1 === 0 ? value : value.toFixed(2)}%`;
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

const TAX_TYPE_LABEL: Record<string, string> = {
  GST: 'GST',
  SALES_TAX: 'Sales Tax',
  WITHHOLDING_TAX: 'Withholding Tax',
};

export function formatTaxType(type: string): string {
  return TAX_TYPE_LABEL[type] ?? type;
}
