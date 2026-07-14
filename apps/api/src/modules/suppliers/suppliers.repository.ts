import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListSuppliersQuery } from './suppliers.validation';

export const suppliersRepository = {
  async list(query: ListSuppliersQuery) {
    const where: Prisma.SupplierWhereInput = {
      ...(query.country ? { country: query.country } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? { name: { contains: query.search } }
        : {}),
    };

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: { _count: { select: { contacts: true } } },
      }),
    ]);

    return { total, suppliers };
  },

  findById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: { contacts: true },
    });
  },

  create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({ data, include: { contacts: true } });
  },

  update(id: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({ where: { id }, data, include: { contacts: true } });
  },

  deactivate(id: string) {
    return prisma.supplier.update({ where: { id }, data: { isActive: false } });
  },

  addContact(supplierId: string, data: Omit<Prisma.SupplierContactCreateInput, 'supplier'>) {
    return prisma.supplierContact.create({ data: { ...data, supplier: { connect: { id: supplierId } } } });
  },

  removeContact(contactId: string) {
    return prisma.supplierContact.delete({ where: { id: contactId } });
  },

  async purchaseHistory(supplierId: string) {
    const orders = await prisma.purchaseOrder.findMany({
      where: { supplierId },
      orderBy: { orderDate: 'desc' },
      include: { items: true },
    });
    return orders.map((po) => ({
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      status: po.status,
      orderDate: po.orderDate,
      totalAmount: po.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    }));
  },

  async distinctProducts(supplierId: string) {
    const items = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrder: { supplierId } },
      distinct: ['productId'],
      include: { product: { select: { id: true, sku: true, name: true } } },
    });
    return items.map((item) => item.product);
  },

  async outstandingBalance(supplierId: string): Promise<number> {
    const [orders, payments] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { supplierId, status: { in: ['ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED'] } },
        include: { items: true },
      }),
      prisma.payment.aggregate({
        where: { supplierId, direction: 'OUTGOING' },
        _sum: { amount: true },
      }),
    ]);

    const totalOwed = orders.reduce(
      (sum, po) => sum + po.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0),
      0,
    );
    return totalOwed - (payments._sum.amount ?? 0);
  },
};
