import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { COMMITTED_PURCHASE_ORDER_STATUSES } from '../../shared/analytics';

export const reportsRepository = {
  /**
   * Sales orders in a date range (optionally filtered by status/distributor), shaped so the
   * service can compute each order's real total via shared/pricing.ts's orderTotal() — the same
   * input shape salesOrders.repository.ts's detail view and distributors.repository.ts's
   * salesHistory() already assemble (items + the distributor's pricingGroup discount).
   */
  salesOrdersInRange(
    from: Date,
    to: Date,
    filters: { status?: Prisma.SalesOrderWhereInput['status']; distributorId?: string },
  ) {
    const where: Prisma.SalesOrderWhereInput = {
      orderDate: { gte: from, lte: to },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.distributorId ? { distributorId: filters.distributorId } : {}),
    };
    return prisma.salesOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: {
        distributor: { select: { name: true, pricingGroup: { select: { discountPercent: true } } } },
        items: true,
      },
    });
  },

  /**
   * Purchase orders in a date range (optionally filtered by status/supplier). Unlike sales
   * orders, POs have no discount/pricing-group math — the service sums quantity*unitPrice
   * directly per IMPLEMENTATION_PLAN.md.
   */
  purchaseOrdersInRange(
    from: Date,
    to: Date,
    filters: { status?: Prisma.PurchaseOrderWhereInput['status']; supplierId?: string },
  ) {
    const where: Prisma.PurchaseOrderWhereInput = {
      orderDate: { gte: from, lte: to },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
    };
    return prisma.purchaseOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: { supplier: { select: { name: true } }, items: true },
    });
  },

  /** All suppliers with the extra fields (country, currency, PO count) the report needs. */
  allSuppliersWithMeta() {
    return prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        currency: true,
        _count: { select: { purchaseOrders: true } },
      },
    });
  },

  /**
   * Committed-status purchase-order items, shaped for shared/analytics.ts's
   * rankSuppliersByCommittedValue — same query shape as dashboard.repository.ts's
   * committedPurchaseOrderItems(), duplicated here rather than cross-imported because each
   * aggregation module (Dashboard, Reports) owns its own trivial single-table queries, the same
   * way both already define their own allSuppliers()/allDistributors(). The actual summing MATH
   * is not duplicated — both call the same shared/analytics.ts function.
   */
  committedPurchaseOrderItems() {
    return prisma.purchaseOrderItem.findMany({
      where: { purchaseOrder: { status: { in: COMMITTED_PURCHASE_ORDER_STATUSES } } },
      select: {
        quantity: true,
        unitPrice: true,
        purchaseOrder: { select: { supplierId: true, exchangeRateToBase: true } },
      },
    });
  },

  /** All distributors with the extra fields (region, pricing group name, sales-order count) the report needs. */
  allDistributorsWithMeta() {
    return prisma.distributor.findMany({
      select: {
        id: true,
        name: true,
        region: true,
        pricingGroup: { select: { name: true } },
        _count: { select: { salesOrders: true } },
      },
    });
  },

  /**
   * All configured taxes (active and inactive) so the tax report can show a per-tax-type
   * breakdown of what's configured, not just the single active-GST rate
   * tax.service.ts's complianceDashboard() surfaces.
   */
  allTaxes() {
    return prisma.tax.findMany({ orderBy: { name: 'asc' } });
  },
};
