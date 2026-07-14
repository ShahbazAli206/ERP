import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';

export const returnsRepository = {
  list() {
    return prisma.salesReturn.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        salesOrder: { select: { orderNumber: true } },
        product: { select: { name: true } },
        creditNote: { select: { id: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.salesReturn.findUnique({
      where: { id },
      include: {
        salesOrder: { select: { orderNumber: true } },
        product: { select: { name: true } },
        creditNote: { select: { id: true } },
      },
    });
  },

  returnedQuantityForItem(salesOrderId: string, productId: string) {
    return prisma.salesReturn.aggregate({
      where: { salesOrderId, productId },
      _sum: { quantity: true },
    });
  },

  async create(
    data: Prisma.SalesReturnCreateInput,
    restock?: { warehouseId: string; lotNumber: string; productId: string; quantity: number; costPrice: number },
  ) {
    return prisma.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.create({ data });

      if (restock) {
        await tx.inventoryLot.upsert({
          where: {
            productId_warehouseId_lotNumber: {
              productId: restock.productId,
              warehouseId: restock.warehouseId,
              lotNumber: restock.lotNumber,
            },
          },
          update: { quantity: { increment: restock.quantity } },
          create: {
            productId: restock.productId,
            warehouseId: restock.warehouseId,
            lotNumber: restock.lotNumber,
            quantity: restock.quantity,
            costPrice: restock.costPrice,
          },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: restock.productId,
            warehouseId: restock.warehouseId,
            type: 'RETURN',
            quantity: restock.quantity,
            lotNumber: restock.lotNumber,
            referenceType: 'SalesReturn',
            referenceId: salesReturn.id,
          },
        });
      }

      return tx.salesReturn.findUniqueOrThrow({
        where: { id: salesReturn.id },
        include: {
          salesOrder: { select: { orderNumber: true } },
          product: { select: { name: true } },
          creditNote: { select: { id: true } },
        },
      });
    });
  },

  createCreditNote(data: Prisma.CreditNoteCreateInput) {
    return prisma.creditNote.create({ data });
  },

  async nextCreditNoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.creditNote.count();
    return `CN-${year}-${String(count + 1).padStart(4, '0')}`;
  },

  listCreditNotes() {
    return prisma.creditNote.findMany({ orderBy: { createdAt: 'desc' } });
  },
};

export type SalesReturnDetail = NonNullable<Awaited<ReturnType<typeof returnsRepository.findById>>>;
