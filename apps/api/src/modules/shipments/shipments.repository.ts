import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListShipmentsQuery } from './shipments.validation';

const detailInclude = {
  purchaseOrder: { select: { id: true, poNumber: true, items: true } },
  items: { include: { product: { select: { name: true, sku: true } } } },
  statusHistory: {
    orderBy: { changedAt: 'asc' as const },
    include: { changedBy: { select: { name: true } } },
  },
} satisfies Prisma.ShipmentInclude;

export const shipmentsRepository = {
  async list(query: ListShipmentsQuery) {
    const where: Prisma.ShipmentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.purchaseOrderId ? { purchaseOrderId: query.purchaseOrderId } : {}),
      ...(query.search ? { shipmentNumber: { contains: query.search } } : {}),
    };

    const [total, shipments] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: { purchaseOrder: { select: { poNumber: true } } },
      }),
    ]);

    return { total, shipments };
  },

  findById(id: string) {
    return prisma.shipment.findUnique({ where: { id }, include: detailInclude });
  },

  async nextShipmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.shipment.count();
    return `SHP-${year}-${String(count + 1).padStart(4, '0')}`;
  },

  create(data: Prisma.ShipmentCreateInput) {
    return prisma.shipment.create({ data, include: detailInclude });
  },

  update(id: string, data: Prisma.ShipmentUpdateInput) {
    return prisma.shipment.update({ where: { id }, data, include: detailInclude });
  },

  async updateStatus(
    id: string,
    status: string,
    changedById: string,
    note: string | undefined,
    actualArrival: Date | undefined,
  ) {
    await prisma.$transaction([
      prisma.shipment.update({
        where: { id },
        data: { status: status as never, ...(actualArrival ? { actualArrival } : {}) },
      }),
      prisma.statusHistory.create({
        data: { entityType: 'Shipment', status, note, changedById, shipmentId: id },
      }),
    ]);
    return this.findById(id);
  },

  delete(id: string) {
    return prisma.shipment.delete({ where: { id } });
  },
};

export type ShipmentDetail = NonNullable<Awaited<ReturnType<typeof shipmentsRepository.findById>>>;
