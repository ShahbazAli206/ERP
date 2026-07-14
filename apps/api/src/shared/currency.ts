/**
 * Converts an amount already expressed in a purchase order's own transaction currency into
 * the system's base currency, using that order's own `exchangeRateToBase` — the same field
 * `shipments.service.ts`'s landed-cost calculation already applies. A single order's own
 * total is fine to display in its native currency (the DTO exposes both `currency` and
 * `exchangeRateToBase` so a caller can convert if it wants to), but anything that SUMS
 * purchase-order values *across* suppliers/orders — which may be in different currencies —
 * must convert each order to base currency first, or it silently adds unlike units together
 * (see IMPLEMENTATION_PLAN.md Gap #8).
 */
export function toBaseAmount(amountInOrderCurrency: number, exchangeRateToBase: number): number {
  return amountInOrderCurrency * exchangeRateToBase;
}
