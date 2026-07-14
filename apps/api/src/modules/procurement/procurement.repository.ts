import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListPurchaseOrdersQuery } from './procurement.validation';

const detailInclude = {
  supplier: true,
  createdBy: { select: { name: true } },
  approvedBy: { select: { name: true } },
  items: { include: { product: { select: { name: true, sku: true } } } },
  attachments: true,
  statusHistory: {
    orderBy: { changedAt: 'asc' as const },
    include: { changedBy: { select: { name: true } } },
  },
} satisfies Prisma.PurchaseOrderInclude;

export const procurementRepository = {
  async list(query: ListPurchaseOrdersQuery) {
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.search ? { poNumber: { contains: query.search } } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: { supplier: { select: { name: true } }, items: true },
      }),
    ]);

    return { total, orders };
  },

  countAll() {
    return prisma.purchaseOrder.count();
  },

  findById(id: string) {
    return prisma.purchaseOrder.findUnique({ where: { id }, include: detailInclude });
  },

  create(data: Prisma.PurchaseOrderCreateInput) {
    return prisma.purchaseOrder.create({ data, include: detailInclude });
  },

  async replaceItems(
    poId: string,
    items: Omit<Prisma.PurchaseOrderItemCreateManyInput, 'purchaseOrderId'>[],
  ) {
    await prisma.$transaction([
      prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: poId } }),
      prisma.purchaseOrderItem.createMany({
        data: items.map((item) => ({ ...item, purchaseOrderId: poId })),
      }),
    ]);
    return this.findById(poId);
  },

  updateFields(id: string, data: Prisma.PurchaseOrderUpdateInput) {
    return prisma.purchaseOrder.update({ where: { id }, data, include: detailInclude });
  },

  async transitionStatus(
    id: string,
    status: Prisma.PurchaseOrderUpdateInput['status'],
    changedById: string,
    note?: string,
    extraData?: Prisma.PurchaseOrderUpdateInput,
  ) {
    await prisma.$transaction([
      prisma.purchaseOrder.update({ where: { id }, data: { status, ...extraData } }),
      prisma.statusHistory.create({
        data: {
          entityType: 'PurchaseOrder',
          status: status as string,
          note,
          changedById,
          purchaseOrderId: id,
        },
      }),
    ]);
    return this.findById(id);
  },

  deleteDraft(id: string) {
    return prisma.purchaseOrder.delete({ where: { id } });
  },

  addAttachment(poId: string, data: Omit<Prisma.AttachmentCreateInput, 'purchaseOrder'>) {
    return prisma.attachment.create({
      data: { ...data, purchaseOrder: { connect: { id: poId } } },
    });
  },

  findAttachment(attachmentId: string) {
    return prisma.attachment.findUnique({ where: { id: attachmentId } });
  },

  removeAttachment(attachmentId: string) {
    return prisma.attachment.delete({ where: { id: attachmentId } });
  },

  async nextPoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count();
    return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  },
};

export type PurchaseOrderDetail = NonNullable<
  Awaited<ReturnType<typeof procurementRepository.findById>>
>;
