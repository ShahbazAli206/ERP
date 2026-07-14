import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { PaginationInput } from '../../shared/pagination';

export const systemLogsRepository = {
  async list(pagination: PaginationInput) {
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(pagination),
        include: { user: { select: { name: true } } },
      }),
    ]);

    return { total, logs };
  },
};
