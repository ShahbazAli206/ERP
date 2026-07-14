import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListAuditLogsQuery, ListTaxesQuery } from './tax.validation';

export const taxRepository = {
  async list(query: ListTaxesQuery) {
    const where: Prisma.TaxWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [total, taxes] = await Promise.all([
      prisma.tax.count({ where }),
      prisma.tax.findMany({
        where,
        orderBy: { name: 'asc' },
        ...toSkipTake(query),
      }),
    ]);

    return { total, taxes };
  },

  findById(id: string) {
    return prisma.tax.findUnique({ where: { id } });
  },

  create(data: Prisma.TaxCreateInput) {
    return prisma.tax.create({ data });
  },

  update(id: string, data: Prisma.TaxUpdateInput) {
    return prisma.tax.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.tax.delete({ where: { id } });
  },

  findFirstActiveGst() {
    return prisma.tax.findFirst({
      where: { type: 'GST', isActive: true },
    });
  },

  async totalInvoicedAmount(): Promise<number> {
    const result = await prisma.invoice.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount ?? 0;
  },

  async listAuditLogs(query: ListAuditLogsQuery) {
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(query),
      }),
    ]);

    return { total, logs };
  },
};
