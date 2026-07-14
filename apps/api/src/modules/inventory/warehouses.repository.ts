import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';

export const warehousesRepository = {
  list() {
    return prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: string) {
    return prisma.warehouse.findUnique({ where: { id } });
  },

  create(data: Prisma.WarehouseCreateInput) {
    return prisma.warehouse.create({ data });
  },

  update(id: string, data: Prisma.WarehouseUpdateInput) {
    return prisma.warehouse.update({ where: { id }, data });
  },

  countLots(id: string) {
    return prisma.inventoryLot.count({ where: { warehouseId: id } });
  },

  delete(id: string) {
    return prisma.warehouse.delete({ where: { id } });
  },
};
