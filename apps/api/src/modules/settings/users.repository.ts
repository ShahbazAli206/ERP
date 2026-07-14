import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { PaginationInput } from '../../shared/pagination';

export const settingsUsersRepository = {
  async list(pagination: PaginationInput) {
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { name: 'asc' },
        ...toSkipTake(pagination),
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          lastLoginAt: true,
          role: { select: { name: true } },
        },
      }),
    ]);

    return { total, users };
  },
};
