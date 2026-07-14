import { prisma } from '../../database/prisma';
import { ApiError } from '../../shared/ApiError';
import type { CreateGoodsReceiptInput, StockAdjustmentInput } from './stock.validation';

/**
 * Consumes stock oldest-lot-first. Shared by manual decrease adjustments here and, later,
 * Sales order fulfillment (Phase 3.6) — both need the same FIFO draw-down behavior.
 */
export async function consumeFifo(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: {
    productId: string;
    warehouseId: string;
    quantity: number;
    type: 'SALE' | 'ADJUSTMENT' | 'TRANSFER';
    referenceType?: string;
    referenceId?: string;
    note?: string;
  },
) {
  const lots = await tx.inventoryLot.findMany({
    where: { productId: params.productId, warehouseId: params.warehouseId, quantity: { gt: 0 } },
    orderBy: { receivedAt: 'asc' },
  });

  let remaining = params.quantity;
  const consumed: Array<{ lotNumber: string; quantity: number }> = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(lot.quantity, remaining);
    await tx.inventoryLot.update({ where: { id: lot.id }, data: { quantity: { decrement: take } } });
    consumed.push({ lotNumber: lot.lotNumber, quantity: take });
    remaining -= take;
  }

  if (remaining > 0) {
    throw ApiError.badRequest(
      `Insufficient stock: requested ${params.quantity}, only ${params.quantity - remaining} available`,
    );
  }

  for (const c of consumed) {
    await tx.inventoryTransaction.create({
      data: {
        productId: params.productId,
        warehouseId: params.warehouseId,
        type: params.type,
        quantity: -c.quantity,
        lotNumber: c.lotNumber,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        note: params.note,
      },
    });
  }

  return consumed;
}

export const stockRepository = {
  async goodsReceipt(input: CreateGoodsReceiptInput) {
    return prisma.$transaction(async (tx) => {
      if (input.purchaseOrderId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: input.purchaseOrderId },
          include: { items: true },
        });
        if (!po) {
          throw ApiError.notFound('Purchase order not found');
        }
        if (po.status !== 'ORDERED' && po.status !== 'PARTIALLY_RECEIVED') {
          throw ApiError.badRequest(
            `Cannot receive goods against a PO in status ${po.status}. Expected ORDERED or PARTIALLY_RECEIVED.`,
          );
        }

        for (const item of input.items) {
          if (!item.purchaseOrderItemId) continue;
          const poItem = po.items.find((i) => i.id === item.purchaseOrderItemId);
          if (!poItem) {
            throw ApiError.badRequest(`Purchase order item ${item.purchaseOrderItemId} not found on this PO`);
          }
          if (poItem.receivedQuantity + item.quantity > poItem.quantity) {
            throw ApiError.badRequest(
              `Receiving ${item.quantity} of ${poItem.productId} would exceed the ordered quantity`,
            );
          }
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQuantity: { increment: item.quantity } },
          });
        }
      }

      for (const item of input.items) {
        await tx.inventoryLot.create({
          data: {
            productId: item.productId,
            warehouseId: input.warehouseId,
            lotNumber: item.lotNumber,
            quantity: item.quantity,
            costPrice: item.costPrice,
            expiryDate: item.expiryDate,
          },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            warehouseId: input.warehouseId,
            type: 'RECEIPT',
            quantity: item.quantity,
            lotNumber: item.lotNumber,
            referenceType: input.purchaseOrderId ? 'PurchaseOrder' : undefined,
            referenceId: input.purchaseOrderId,
          },
        });
      }

      if (input.purchaseOrderId) {
        const refreshedItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: input.purchaseOrderId },
        });
        const allReceived = refreshedItems.every((i) => i.receivedQuantity >= i.quantity);
        const anyReceived = refreshedItems.some((i) => i.receivedQuantity > 0);
        const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : undefined;
        if (newStatus) {
          await tx.purchaseOrder.update({
            where: { id: input.purchaseOrderId },
            data: { status: newStatus },
          });
          await tx.statusHistory.create({
            data: {
              entityType: 'PurchaseOrder',
              status: newStatus,
              purchaseOrderId: input.purchaseOrderId,
              note: 'Recorded via goods receipt',
            },
          });
        }
      }

      return tx.inventoryLot.findMany({
        where: {
          warehouseId: input.warehouseId,
          productId: { in: input.items.map((i) => i.productId) },
        },
        orderBy: { receivedAt: 'desc' },
        take: input.items.length,
      });
    });
  },

  async adjust(input: StockAdjustmentInput) {
    return prisma.$transaction(async (tx) => {
      if (input.quantityDelta > 0) {
        const lot = await tx.inventoryLot.upsert({
          where: {
            productId_warehouseId_lotNumber: {
              productId: input.productId,
              warehouseId: input.warehouseId,
              lotNumber: input.lotNumber!,
            },
          },
          update: { quantity: { increment: input.quantityDelta } },
          create: {
            productId: input.productId,
            warehouseId: input.warehouseId,
            lotNumber: input.lotNumber!,
            quantity: input.quantityDelta,
            costPrice: input.costPrice!,
            expiryDate: input.expiryDate,
          },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: input.productId,
            warehouseId: input.warehouseId,
            type: 'ADJUSTMENT',
            quantity: input.quantityDelta,
            lotNumber: lot.lotNumber,
            note: input.reason,
          },
        });
        return [{ lotNumber: lot.lotNumber, quantity: input.quantityDelta }];
      }

      return consumeFifo(tx, {
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: -input.quantityDelta,
        type: 'ADJUSTMENT',
        note: input.reason,
      });
    });
  },

  async lowStockProducts() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { inventoryLots: { select: { quantity: true } } },
    });
    return products
      .map((p) => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        stockOnHand: p.inventoryLots.reduce((sum, l) => sum + l.quantity, 0),
        reorderLevel: p.reorderLevel,
      }))
      .filter((p) => p.stockOnHand <= p.reorderLevel);
  },

  expiringLots(withinDays: number) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + withinDays);
    return prisma.inventoryLot.findMany({
      where: { quantity: { gt: 0 }, expiryDate: { not: null, lte: threshold } },
      orderBy: { expiryDate: 'asc' },
      include: { product: { select: { name: true, sku: true } }, warehouse: { select: { name: true } } },
    });
  },

  valuation(warehouseId?: string) {
    return prisma.inventoryLot.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: { product: { select: { id: true, sku: true, name: true } } },
    });
  },
};
