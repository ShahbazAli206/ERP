import { prisma } from '../../database/prisma';

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
  },

  updateLastLogin(id: string) {
    return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },
};

export type AuthUserWithRole = NonNullable<
  Awaited<ReturnType<typeof authRepository.findUserByEmail>>
>;
