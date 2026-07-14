import { prisma } from '../../database/prisma';

export const aiRepository = {
  /**
   * Sum of quantity sold per product across DELIVERED sales orders, descending, top `limit`.
   * Real aggregation (not demo data).
   */
  async topSellingProductTotals(limit: number) {
    return prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: { salesOrder: { status: 'DELIVERED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
  },

  productsByIds(ids: string[]) {
    return prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, sku: true, name: true },
    });
  },

  /** All active products with id/sku/name only. Real data. */
  activeProducts() {
    return prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true },
    });
  },

  /** Stock on hand per product, summed across all inventory lots. Real aggregation. */
  async stockOnHandByProduct(): Promise<Map<string, number>> {
    const lots = await prisma.inventoryLot.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
    });
    return new Map(lots.map((l) => [l.productId, l._sum.quantity ?? 0]));
  },

  /** Most recent SALE transaction date per product. Real aggregation. */
  async lastSaleDateByProduct(): Promise<Map<string, Date>> {
    const sales = await prisma.inventoryTransaction.groupBy({
      by: ['productId'],
      where: { type: 'SALE' },
      _max: { createdAt: true },
    });
    return new Map(
      sales
        .filter((s): s is typeof s & { _max: { createdAt: Date } } => s._max.createdAt !== null)
        .map((s) => [s.productId, s._max.createdAt]),
    );
  },

  /**
   * A small pool of real product names/skus to populate demo (fake-data) endpoints so
   * they look plausibly populated. Not used for any real forecasting.
   */
  async sampleProductPool(poolSize: number) {
    return prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true },
      take: poolSize,
    });
  },
};
