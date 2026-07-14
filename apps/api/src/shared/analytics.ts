import { PurchaseOrderStatus, SalesOrderStatus } from '../generated/prisma/enums';
import { lineTotal } from './pricing';
import { toBaseAmount } from './currency';

/**
 * Cross-module aggregation helpers used by the Dashboard module (Phase 3.10) and, once it's
 * built, Reports (Phase 3.11) — both need the same "real sales total via shared pricing"
 * category-breakdown/ranking crunching, just with different upstream filtering (date ranges,
 * status sets, etc. applied by the caller's own repository query). Lives here rather than in
 * modules/dashboard/ for the same reason shared/pricing.ts does: two modules computing the
 * same total two different ways is how this codebase has twice ended up with numbers that
 * silently disagreed with each other.
 */

/**
 * Sales-order statuses treated as "committed" (stock has actually been deducted, and the
 * order isn't a reversed/never-happened one) across the dashboard and reports. Excludes DRAFT
 * (hasn't happened yet) and CANCELLED (its stock consumption is explicitly reversed).
 */
export const COMMITTED_SALES_ORDER_STATUSES: SalesOrderStatus[] = [
  SalesOrderStatus.CONFIRMED,
  SalesOrderStatus.PROCESSING,
  SalesOrderStatus.SHIPPED,
  SalesOrderStatus.DELIVERED,
];

/**
 * Purchase-order statuses treated as "committed spend" — an order actually placed with the
 * supplier (ORDERED or later). Excludes DRAFT/PENDING_APPROVAL/APPROVED (not yet placed),
 * REJECTED and CANCELLED.
 */
export const COMMITTED_PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = [
  PurchaseOrderStatus.ORDERED,
  PurchaseOrderStatus.PARTIALLY_RECEIVED,
  PurchaseOrderStatus.RECEIVED,
];

export interface CategoryTotal {
  categoryId: string | null;
  categoryName: string;
  total: number;
}

interface ProductCategoryRef {
  categoryId: string | null;
  category: { name: string } | null;
}

/**
 * Sums sales-order line revenue per product category using the exact same discount math as
 * shared/pricing.ts (item discount + distributor pricing-group discount + automatic volume
 * discount, then the order-level discount applied over the subtotal) — never re-derive
 * discount math by hand here. Summing the totals this returns across all categories for a
 * given set of orders reproduces exactly what `orderTotal()` would return per order.
 *
 * The caller's own repository query is responsible for filtering which orders to include
 * (status, date range, etc.) — this function only does the category-crunching.
 */
export function groupSalesRevenueByCategory(
  orders: Array<{
    discountPercent: number;
    distributor: { pricingGroup: { discountPercent: number } | null } | null;
    items: Array<{
      unitPrice: number;
      quantity: number;
      discount: number;
      product: ProductCategoryRef | null;
    }>;
  }>,
): CategoryTotal[] {
  const buckets = new Map<string, CategoryTotal>();

  for (const order of orders) {
    const pricingGroupDiscountPercent = order.distributor?.pricingGroup?.discountPercent ?? 0;
    for (const item of order.items) {
      const { total } = lineTotal({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        itemDiscountPercent: item.discount,
        pricingGroupDiscountPercent,
      });
      // Mirrors orderTotal(): the order-level discount applies over the summed line subtotal.
      const adjusted = total * (1 - order.discountPercent / 100);

      const categoryId = item.product?.categoryId ?? null;
      const categoryName = item.product?.category?.name ?? 'Uncategorized';
      const key = categoryId ?? '__uncategorized__';
      const bucket = buckets.get(key) ?? { categoryId, categoryName, total: 0 };
      bucket.total += adjusted;
      buckets.set(key, bucket);
    }
  }

  return Array.from(buckets.values()).sort((a, b) => b.total - a.total);
}

/**
 * Sums inventory-lot valuation (quantity * costPrice — the same per-line math
 * inventory/stock.service.ts's valuation() uses) grouped by product category instead of by
 * product. Fed with the same InventoryLot rows stock.service.ts's valuation() reads, so the
 * totals reconcile with its grandTotal.
 */
export function groupInventoryValuationByCategory(
  lots: Array<{ quantity: number; costPrice: number; product: ProductCategoryRef | null }>,
): CategoryTotal[] {
  const buckets = new Map<string, CategoryTotal>();

  for (const lot of lots) {
    const categoryId = lot.product?.categoryId ?? null;
    const categoryName = lot.product?.category?.name ?? 'Uncategorized';
    const key = categoryId ?? '__uncategorized__';
    const bucket = buckets.get(key) ?? { categoryId, categoryName, total: 0 };
    bucket.total += lot.quantity * lot.costPrice;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).sort((a, b) => b.total - a.total);
}

export interface RankedEntity {
  id: string;
  name: string;
  totalValue: number;
}

/** Generic descending-by-value top-N ranking, shared by the supplier and distributor leaderboards. */
export function rankByValueDesc<T extends { totalValue: number }>(entries: T[], limit: number): T[] {
  return [...entries].sort((a, b) => b.totalValue - a.totalValue).slice(0, limit);
}

/**
 * Sums PurchaseOrderItem quantity*unitPrice grouped by the parent PO's supplier, ranked
 * descending, top `limit`. The caller's repository query is responsible for restricting
 * `items` to whichever PO statuses count as "committed" (see COMMITTED_PURCHASE_ORDER_STATUSES).
 * Each item's line value is converted to base currency via its own PO's `exchangeRateToBase`
 * before being summed — suppliers/orders are not guaranteed to share one currency, so summing
 * raw native-currency amounts across them would silently mix units (IMPLEMENTATION_PLAN.md Gap #8).
 */
export function rankSuppliersByCommittedValue(
  items: Array<{
    quantity: number;
    unitPrice: number;
    purchaseOrder: { supplierId: string; exchangeRateToBase: number };
  }>,
  suppliers: Array<{ id: string; name: string }>,
  limit: number,
): RankedEntity[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const supplierId = item.purchaseOrder.supplierId;
    const lineValueInBase = toBaseAmount(item.quantity * item.unitPrice, item.purchaseOrder.exchangeRateToBase);
    totals.set(supplierId, (totals.get(supplierId) ?? 0) + lineValueInBase);
  }
  const nameById = new Map(suppliers.map((s) => [s.id, s.name]));
  const ranked = Array.from(totals.entries()).map(([id, totalValue]) => ({
    id,
    name: nameById.get(id) ?? 'Unknown supplier',
    totalValue,
  }));
  return rankByValueDesc(ranked, limit);
}

/**
 * Sums a distributor's own sales-history entries — as computed by
 * distributorsRepository.salesHistory(), which already applies the shared pricing calculator —
 * restricted to committed order statuses. Does not recompute any order totals itself; that's
 * the exact bug (Distributors computing its own naive totals) already fixed once in this
 * codebase for the outstanding-balance calc.
 */
export function committedSalesTotal(history: Array<{ status: string; totalAmount: number }>): number {
  return history
    .filter((h) => (COMMITTED_SALES_ORDER_STATUSES as string[]).includes(h.status))
    .reduce((sum, h) => sum + h.totalAmount, 0);
}
