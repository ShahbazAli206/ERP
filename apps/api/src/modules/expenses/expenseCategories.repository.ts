import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';

export const expenseCategoriesRepository = {
  list() {
    return prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });
  },

  findById(id: string) {
    return prisma.expenseCategory.findUnique({ where: { id } });
  },

  create(data: Prisma.ExpenseCategoryCreateInput) {
    return prisma.expenseCategory.create({ data });
  },

  update(id: string, data: Prisma.ExpenseCategoryUpdateInput) {
    return prisma.expenseCategory.update({ where: { id }, data });
  },

  countExpenses(id: string) {
    return prisma.expense.count({ where: { categoryId: id } });
  },

  delete(id: string) {
    return prisma.expenseCategory.delete({ where: { id } });
  },
};
