import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import { orderTotal } from '../../shared/pricing';
import type { ListDistributorsQuery } from './distributors.validation';

export const distributorsRepository = {
  async list(query: ListDistributorsQuery) {
    const where: Prisma.DistributorWhereInput = {
      ...(query.region ? { region: query.region } : {}),
      ...(query.pricingGroupId ? { pricingGroupId: query.pricingGroupId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search ? { name: { contains: query.search } } : {}),
    };

    const [total, distributors] = await Promise.all([
      prisma.distributor.count({ where }),
      prisma.distributor.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: { pricingGroup: { select: { name: true } } },
      }),
    ]);

    return { total, distributors };
  },

  findById(id: string) {
    return prisma.distributor.findUnique({
      where: { id },
      include: { pricingGroup: true },
    });
  },

  create(data: Prisma.DistributorCreateInput) {
    return prisma.distributor.create({ data, include: { pricingGroup: true } });
  },

  update(id: string, data: Prisma.DistributorUpdateInput) {
    return prisma.distributor.update({ where: { id }, data, include: { pricingGroup: true } });
  },

  deactivate(id: string) {
    return prisma.distributor.update({ where: { id }, data: { isActive: false } });
  },

  async salesHistory(distributorId: string) {
    const [distributor, orders] = await Promise.all([
      prisma.distributor.findUniqueOrThrow({
        where: { id: distributorId },
        include: { pricingGroup: true },
      }),
      prisma.salesOrder.findMany({
        where: { distributorId },
        orderBy: { orderDate: 'desc' },
        include: { items: true },
      }),
    ]);
    const pricingGroupDiscountPercent = distributor.pricingGroup?.discountPercent ?? 0;
    return orders.map((so) => ({
      salesOrderId: so.id,
      orderNumber: so.orderNumber,
      status: so.status,
      orderDate: so.orderDate,
      totalAmount: orderTotal({
        items: so.items,
        pricingGroupDiscountPercent,
        orderDiscountPercent: so.discountPercent,
      }),
    }));
  },

  paymentHistory(distributorId: string) {
    return prisma.payment.findMany({
      where: { distributorId },
      orderBy: { paymentDate: 'desc' },
    });
  },

  async outstandingBalance(distributorId: string): Promise<number> {
    const invoices = await prisma.invoice.findMany({
      where: {
        salesOrder: { distributorId },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      include: { creditNotes: true },
    });
    return invoices.reduce((sum, inv) => {
      const creditNotesTotal = inv.creditNotes.reduce((s, cn) => s + cn.amount, 0);
      return sum + (inv.totalAmount - inv.paidAmount - creditNotesTotal);
    }, 0);
  },
};

export type DistributorWithPricingGroup = NonNullable<
  Awaited<ReturnType<typeof distributorsRepository.findById>>
>;
