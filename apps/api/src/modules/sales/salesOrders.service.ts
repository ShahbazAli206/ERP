import { prisma } from '../../database/prisma';
import { SalesOrderStatus } from '../../generated/prisma/enums';
import { consumeFifo } from '../inventory/stock.repository';
import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { lineTotal, orderTotal } from '../../shared/pricing';
import { salesOrdersRepository, type SalesOrderDetail } from './salesOrders.repository';
import type { SalesOrderDetailDto, SalesOrderListItemDto } from './salesOrders.dto';
import type {
  CreateSalesOrderInput,
  ListSalesOrdersQuery,
  UpdateSalesOrderInput,
} from './salesOrders.validation';

const ADVANCE_TRANSITIONS: Record<string, string> = {
  [SalesOrderStatus.CONFIRMED]: SalesOrderStatus.PROCESSING,
  [SalesOrderStatus.PROCESSING]: SalesOrderStatus.SHIPPED,
  [SalesOrderStatus.SHIPPED]: SalesOrderStatus.DELIVERED,
};

const CANCELLABLE_STATUSES: string[] = [
  SalesOrderStatus.DRAFT,
  SalesOrderStatus.CONFIRMED,
  SalesOrderStatus.PROCESSING,
];

// Statuses reached only after stock was consumed at confirm() — cancelling from here needs
// the consumption reversed, not just a status flip.
const STOCK_CONSUMED_STATUSES: string[] = [SalesOrderStatus.CONFIRMED, SalesOrderStatus.PROCESSING];

function computeOrderTotal(order: SalesOrderDetail): number {
  return orderTotal({
    items: order.items,
    pricingGroupDiscountPercent: order.distributor.pricingGroup?.discountPercent ?? 0,
    orderDiscountPercent: order.discountPercent,
  });
}

function toDetailDto(order: SalesOrderDetail): SalesOrderDetailDto {
  const pricingGroupDiscountPercent = order.distributor.pricingGroup?.discountPercent ?? 0;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    currency: order.currency,
    discountPercent: order.discountPercent,
    orderDate: order.orderDate,
    distributor: {
      id: order.distributor.id,
      name: order.distributor.name,
      region: order.distributor.region,
      pricingGroupDiscountPercent,
    },
    createdByName: order.createdBy.name,
    items: order.items.map((item) => {
      const { total, effectiveDiscountPercent } = lineTotal({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        itemDiscountPercent: item.discount,
        pricingGroupDiscountPercent,
      });
      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        effectiveDiscountPercent,
        lineTotal: total,
      };
    }),
    statusHistory: order.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      changedAt: h.changedAt,
      changedByName: h.changedBy?.name ?? null,
    })),
    totalAmount: computeOrderTotal(order),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function getOrThrow(id: string): Promise<SalesOrderDetail> {
  const order = await salesOrdersRepository.findById(id);
  if (!order) {
    throw ApiError.notFound('Sales order not found');
  }
  return order;
}

async function reverseSaleConsumption(orderId: string) {
  const consumptionTxns = await prisma.inventoryTransaction.findMany({
    where: { referenceType: 'SalesOrder', referenceId: orderId, type: 'SALE' },
  });
  for (const txn of consumptionTxns) {
    if (!txn.lotNumber) continue;
    await prisma.inventoryLot.updateMany({
      where: { productId: txn.productId, warehouseId: txn.warehouseId, lotNumber: txn.lotNumber },
      data: { quantity: { increment: -txn.quantity } },
    });
    await prisma.inventoryTransaction.create({
      data: {
        productId: txn.productId,
        warehouseId: txn.warehouseId,
        type: 'RETURN',
        quantity: -txn.quantity,
        lotNumber: txn.lotNumber,
        referenceType: 'SalesOrder',
        referenceId: orderId,
        note: 'Reversed due to order cancellation',
      },
    });
  }
}

export const salesOrdersService = {
  async list(
    query: ListSalesOrdersQuery,
  ): Promise<{ items: SalesOrderListItemDto[]; pagination: Pagination }> {
    const { total, orders } = await salesOrdersRepository.list(query);
    return {
      items: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        distributorId: o.distributorId,
        distributorName: o.distributor.name,
        status: o.status,
        currency: o.currency,
        orderDate: o.orderDate,
        totalAmount: orderTotal({
          items: o.items,
          pricingGroupDiscountPercent: 0,
          orderDiscountPercent: o.discountPercent,
        }),
        createdAt: o.createdAt,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getDetail(id: string): Promise<SalesOrderDetailDto> {
    return toDetailDto(await getOrThrow(id));
  },

  async create(input: CreateSalesOrderInput, createdById: string): Promise<SalesOrderDetailDto> {
    const orderNumber = await salesOrdersRepository.nextOrderNumber();
    const { items, distributorId, ...rest } = input;
    const created = await salesOrdersRepository.create({
      ...rest,
      orderNumber,
      distributor: { connect: { id: distributorId } },
      createdBy: { connect: { id: createdById } },
      items: { create: items },
    });
    return toDetailDto(created);
  },

  async update(id: string, input: UpdateSalesOrderInput): Promise<SalesOrderDetailDto> {
    const order = await getOrThrow(id);
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw ApiError.badRequest('Can only edit a sales order while it is DRAFT');
    }
    const { items, ...rest } = input;
    let updated = order;
    if (Object.keys(rest).length > 0) {
      updated = await salesOrdersRepository.updateFields(id, rest);
    }
    if (items) {
      updated = (await salesOrdersRepository.replaceItems(id, items))!;
    }
    return toDetailDto(updated);
  },

  async confirm(id: string, userId: string, warehouseId: string): Promise<SalesOrderDetailDto> {
    const order = await getOrThrow(id);
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw ApiError.badRequest(`Cannot confirm a sales order in status ${order.status}`);
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await consumeFifo(tx, {
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
          type: 'SALE',
          referenceType: 'SalesOrder',
          referenceId: id,
        });
      }
      await tx.salesOrder.update({ where: { id }, data: { status: SalesOrderStatus.CONFIRMED } });
      await tx.statusHistory.create({
        data: { entityType: 'SalesOrder', status: SalesOrderStatus.CONFIRMED, changedById: userId, salesOrderId: id },
      });
    });

    return toDetailDto((await salesOrdersRepository.findById(id))!);
  },

  async advance(id: string, userId: string): Promise<SalesOrderDetailDto> {
    const order = await getOrThrow(id);
    const next = ADVANCE_TRANSITIONS[order.status];
    if (!next) {
      throw ApiError.badRequest(`Cannot advance a sales order in status ${order.status}`);
    }
    const updated = await salesOrdersRepository.recordStatusChange(id, next, userId);
    return toDetailDto(updated!);
  },

  async cancel(id: string, userId: string): Promise<SalesOrderDetailDto> {
    const order = await getOrThrow(id);
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw ApiError.badRequest(`Cannot cancel a sales order in status ${order.status}`);
    }
    if (STOCK_CONSUMED_STATUSES.includes(order.status)) {
      await reverseSaleConsumption(id);
    }
    const updated = await salesOrdersRepository.recordStatusChange(
      id,
      SalesOrderStatus.CANCELLED,
      userId,
    );
    return toDetailDto(updated!);
  },

  async deleteDraft(id: string) {
    const order = await getOrThrow(id);
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw ApiError.badRequest('Can only delete a sales order while it is DRAFT');
    }
    await salesOrdersRepository.deleteDraft(id);
  },
};
