import { prisma } from '../../database/prisma';
import { COMMITTED_PURCHASE_ORDER_STATUSES, COMMITTED_SALES_ORDER_STATUSES } from '../../shared/analytics';

export const dashboardRepository = {
  // Plain counts not owned by any other module — simple enough that reimplementing them here
  // carries no risk of disagreeing with another module's math.
  shipmentsInTransitCount() {
    return prisma.shipment.count({ where: { status: 'IN_TRANSIT' } });
  },

  pendingPurchaseOrdersCount() {
    return prisma.purchaseOrder.count({ where: { status: 'PENDING_APPROVAL' } });
  },

  allSuppliers() {
    return prisma.supplier.findMany({ select: { id: true, name: true } });
  },

  allDistributors() {
    return prisma.distributor.findMany({ select: { id: true, name: true } });
  },

  /**
   * Extends inventory's own valuation() query (stock.repository.ts) with the product's
   * category so the dashboard can break the same valuation down per-category — reads the same
   * InventoryLot rows with the same quantity/costPrice fields, so summing this across
   * categories reconciles with stockService.valuation()'s grandTotal.
   */
  inventoryLotsWithCategory() {
    return prisma.inventoryLot.findMany({
      select: {
        quantity: true,
        costPrice: true,
        product: { select: { categoryId: true, category: { select: { name: true } } } },
      },
    });
  },

  /**
   * Committed-status sales orders (see COMMITTED_SALES_ORDER_STATUSES) within a date range,
   * shaped for shared/analytics.ts's groupSalesRevenueByCategory — which reproduces
   * shared/pricing.ts's orderTotal() math exactly, just broken down by category.
   */
  committedSalesOrdersInRange(from: Date, to: Date) {
    return prisma.salesOrder.findMany({
      where: {
        orderDate: { gte: from, lte: to },
        status: { in: COMMITTED_SALES_ORDER_STATUSES },
      },
      select: {
        discountPercent: true,
        distributor: { select: { pricingGroup: { select: { discountPercent: true } } } },
        items: {
          select: {
            unitPrice: true,
            quantity: true,
            discount: true,
            product: { select: { categoryId: true, category: { select: { name: true } } } },
          },
        },
      },
    });
  },

  /**
   * Purchase-order items restricted to committed statuses (see
   * COMMITTED_PURCHASE_ORDER_STATUSES), shaped for shared/analytics.ts's
   * rankSuppliersByCommittedValue.
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

  /** Latest StatusHistory rows across PO/Shipment/SalesOrder, joined for human-readable labels. */
  recentActivities(limit: number) {
    return prisma.statusHistory.findMany({
      orderBy: { changedAt: 'desc' },
      take: limit,
      include: {
        changedBy: { select: { name: true } },
        purchaseOrder: { select: { poNumber: true } },
        shipment: { select: { shipmentNumber: true } },
        salesOrder: { select: { orderNumber: true } },
      },
    });
  },
};
