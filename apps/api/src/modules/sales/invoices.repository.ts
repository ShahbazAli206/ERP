import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListInvoicesQuery } from './invoices.validation';

const detailInclude = {
  salesOrder: { include: { distributor: true } },
  payments: { orderBy: { paymentDate: 'desc' as const } },
  creditNotes: true,
} satisfies Prisma.InvoiceInclude;

export const invoicesRepository = {
  async list(query: ListInvoicesQuery) {
    const where: Prisma.InvoiceWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { invoiceNumber: { contains: query.search } } : {}),
    };

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: { salesOrder: { include: { distributor: { select: { name: true } } } } },
      }),
    ]);

    return { total, invoices };
  },

  findById(id: string) {
    return prisma.invoice.findUnique({ where: { id }, include: detailInclude });
  },

  findActiveBySalesOrderId(salesOrderId: string) {
    return prisma.invoice.findFirst({
      where: { salesOrderId, status: { not: 'CANCELLED' } },
    });
  },

  async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  },

  create(data: Prisma.InvoiceCreateInput) {
    return prisma.invoice.create({ data, include: detailInclude });
  },

  async recordPayment(
    invoiceId: string,
    distributorId: string,
    currency: string,
    data: { amount: number; method: string; paymentDate?: Date; reference?: string; bankAccountId?: string },
    newStatus: string,
  ) {
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          direction: 'INCOMING',
          amount: data.amount,
          method: data.method as never,
          currency,
          paymentDate: data.paymentDate ?? new Date(),
          reference: data.reference,
          bankAccountId: data.bankAccountId,
          distributorId,
          invoiceId,
        },
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: { increment: data.amount }, status: newStatus as never },
      }),
    ]);
    return this.findById(invoiceId);
  },
};

export type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof invoicesRepository.findById>>>;
