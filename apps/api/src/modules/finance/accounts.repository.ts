import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListAccountsQuery } from './accounts.validation';

export const accountsRepository = {
  async list(query: ListAccountsQuery) {
    const where: Prisma.AccountWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.search ? { name: { contains: query.search } } : {}),
    };

    const [total, accounts] = await Promise.all([
      prisma.account.count({ where }),
      prisma.account.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
      }),
    ]);

    return { total, accounts };
  },

  findById(id: string) {
    return prisma.account.findUnique({ where: { id } });
  },

  create(data: Prisma.AccountCreateInput) {
    return prisma.account.create({ data });
  },

  update(id: string, data: Prisma.AccountUpdateInput) {
    return prisma.account.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.account.delete({ where: { id } });
  },
};
