import { prisma } from '../../database/prisma';

export const settingsRolesRepository = {
  list() {
    return prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { permissions: { include: { permission: true } } },
    });
  },
};
