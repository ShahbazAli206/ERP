/**
 * Volume pricing tiers: larger orders earn an extra discount on top of whatever item-level
 * and distributor pricing-group discounts already apply. Demo simplification: all applicable
 * discount percentages (item + pricing group + volume) are summed once and capped at 100,
 * rather than compounded multiplicatively — easier to reason about on an invoice line.
 *
 * Lives in shared/ (not modules/sales/) because both the Sales module and the Distributors
 * module's sales-history/outstanding-balance calculations need the exact same order total —
 * computing it two different ways previously caused the two to disagree.
 */
const VOLUME_DISCOUNT_TIERS: Array<{ minQuantity: number; extraDiscountPercent: number }> = [
  { minQuantity: 100, extraDiscountPercent: 5 },
  { minQuantity: 50, extraDiscountPercent: 2.5 },
];

export function volumeDiscountPercent(quantity: number): number {
  const tier = VOLUME_DISCOUNT_TIERS.find((t) => quantity >= t.minQuantity);
  return tier?.extraDiscountPercent ?? 0;
}

export function lineTotal(params: {
  unitPrice: number;
  quantity: number;
  itemDiscountPercent: number;
  pricingGroupDiscountPercent: number;
}): { total: number; effectiveDiscountPercent: number } {
  const volumeDiscount = volumeDiscountPercent(params.quantity);
  const effectiveDiscountPercent = Math.min(
    100,
    params.itemDiscountPercent + params.pricingGroupDiscountPercent + volumeDiscount,
  );
  const total = params.unitPrice * params.quantity * (1 - effectiveDiscountPercent / 100);
  return { total, effectiveDiscountPercent };
}

export function orderTotal(params: {
  items: Array<{ unitPrice: number; quantity: number; discount: number }>;
  pricingGroupDiscountPercent: number;
  orderDiscountPercent: number;
}): number {
  const subtotal = params.items.reduce(
    (sum, item) =>
      sum +
      lineTotal({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        itemDiscountPercent: item.discount,
        pricingGroupDiscountPercent: params.pricingGroupDiscountPercent,
      }).total,
    0,
  );
  return subtotal * (1 - params.orderDiscountPercent / 100);
}
