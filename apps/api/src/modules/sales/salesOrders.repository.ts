import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListSalesOrdersQuery } from './salesOrders.validation';

const detailInclude = {
  distributor: { include: { pricingGroup: true } },
  createdBy: { select: { name: true } },
  items: { include: { product: { select: { name: true, sku: true } } } },
  statusHistory: {
    orderBy: { changedAt: 'asc' as const },
    include: { changedBy: { select: { name: true } } },
  },
} satisfies Prisma.SalesOrderInclude;

export const salesOrdersRepository = {
  async list(query: ListSalesOrdersQuery) {
    const where: Prisma.SalesOrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.distributorId ? { distributorId: query.distributorId } : {}),
      ...(query.search ? { orderNumber: { contains: query.search } } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.salesOrder.count({ where }),
      prisma.salesOrder.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: { distributor: { select: { name: true } }, items: true },
      }),
    ]);

    return { total, orders };
  },

  findById(id: string) {
    return prisma.salesOrder.findUnique({ where: { id }, include: detailInclude });
  },

  async nextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.salesOrder.count();
    return `SO-${year}-${String(count + 1).padStart(4, '0')}`;
  },

  create(data: Prisma.SalesOrderCreateInput) {
    return prisma.salesOrder.create({ data, include: detailInclude });
  },

  async replaceItems(
    orderId: string,
    items: Omit<Prisma.SalesOrderItemCreateManyInput, 'salesOrderId'>[],
  ) {
    await prisma.$transaction([
      prisma.salesOrderItem.deleteMany({ where: { salesOrderId: orderId } }),
      prisma.salesOrderItem.createMany({ data: items.map((item) => ({ ...item, salesOrderId: orderId })) }),
    ]);
    return this.findById(orderId);
  },

  updateFields(id: string, data: Prisma.SalesOrderUpdateInput) {
    return prisma.salesOrder.update({ where: { id }, data, include: detailInclude });
  },

  async recordStatusChange(id: string, status: string, changedById: string, note?: string) {
    await prisma.$transaction([
      prisma.salesOrder.update({ where: { id }, data: { status: status as never } }),
      prisma.statusHistory.create({
        data: { entityType: 'SalesOrder', status, note, changedById, salesOrderId: id },
      }),
    ]);
    return this.findById(id);
  },

  deleteDraft(id: string) {
    return prisma.salesOrder.delete({ where: { id } });
  },
};

export type SalesOrderDetail = NonNullable<Awaited<ReturnType<typeof salesOrdersRepository.findById>>>;
