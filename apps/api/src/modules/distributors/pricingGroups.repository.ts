import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';

export const pricingGroupsRepository = {
  list() {
    return prisma.pricingGroup.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { distributors: true } } },
    });
  },

  findById(id: string) {
    return prisma.pricingGroup.findUnique({ where: { id } });
  },

  create(data: Prisma.PricingGroupCreateInput) {
    return prisma.pricingGroup.create({ data });
  },

  update(id: string, data: Prisma.PricingGroupUpdateInput) {
    return prisma.pricingGroup.update({ where: { id }, data });
  },

  async delete(id: string) {
    await prisma.distributor.updateMany({ where: { pricingGroupId: id }, data: { pricingGroupId: null } });
    return prisma.pricingGroup.delete({ where: { id } });
  },
};
