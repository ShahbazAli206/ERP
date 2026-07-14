import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListExpensesQuery } from './expenses.validation';

const detailInclude = {
  category: { select: { id: true, name: true } },
  createdBy: { select: { name: true } },
  attachments: true,
} satisfies Prisma.ExpenseInclude;

export const expensesRepository = {
  async list(query: ListExpensesQuery) {
    const where: Prisma.ExpenseWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search ? { description: { contains: query.search } } : {}),
      ...(query.from || query.to
        ? {
            expenseDate: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: {
          category: { select: { name: true } },
          createdBy: { select: { name: true } },
          _count: { select: { attachments: true } },
        },
      }),
    ]);

    return { total, expenses };
  },

  findById(id: string) {
    return prisma.expense.findUnique({ where: { id }, include: detailInclude });
  },

  create(data: Prisma.ExpenseCreateInput) {
    return prisma.expense.create({ data, include: detailInclude });
  },

  update(id: string, data: Prisma.ExpenseUpdateInput) {
    return prisma.expense.update({ where: { id }, data, include: detailInclude });
  },

  delete(id: string) {
    // Attachment.expenseId has onDelete: Cascade, so attachment rows are removed
    // automatically; the physical files still need to be cleaned up by the caller first.
    return prisma.expense.delete({ where: { id } });
  },

  addAttachment(expenseId: string, data: Omit<Prisma.AttachmentCreateInput, 'expense'>) {
    return prisma.attachment.create({
      data: { ...data, expense: { connect: { id: expenseId } } },
    });
  },

  findAttachment(attachmentId: string) {
    return prisma.attachment.findUnique({ where: { id: attachmentId } });
  },

  removeAttachment(attachmentId: string) {
    return prisma.attachment.delete({ where: { id: attachmentId } });
  },

  async reportByCategory(from: Date, to: Date) {
    const grouped = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { expenseDate: { gte: from, lte: to } },
      _sum: { amount: true },
    });

    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) } },
    });
    const nameById = new Map(categories.map((c) => [c.id, c.name]));

    return grouped.map((g) => ({
      categoryId: g.categoryId,
      categoryName: nameById.get(g.categoryId) ?? 'Unknown',
      total: g._sum.amount ?? 0,
    }));
  },
};

export type ExpenseDetail = NonNullable<Awaited<ReturnType<typeof expensesRepository.findById>>>;
