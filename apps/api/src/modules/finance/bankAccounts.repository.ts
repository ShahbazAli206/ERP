import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListBankAccountsQuery } from './bankAccounts.validation';

export const bankAccountsRepository = {
  async list(query: ListBankAccountsQuery) {
    const where: Prisma.BankAccountWhereInput = {
      ...(query.search ? { name: { contains: query.search } } : {}),
    };

    const [total, bankAccounts] = await Promise.all([
      prisma.bankAccount.count({ where }),
      prisma.bankAccount.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
      }),
    ]);

    return { total, bankAccounts };
  },

  findById(id: string) {
    return prisma.bankAccount.findUnique({ where: { id } });
  },

  create(data: Prisma.BankAccountCreateInput) {
    return prisma.bankAccount.create({ data });
  },

  update(id: string, data: Prisma.BankAccountUpdateInput) {
    return prisma.bankAccount.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.bankAccount.delete({ where: { id } });
  },

  balanceSum() {
    return prisma.bankAccount.aggregate({ _sum: { balance: true } });
  },
};
