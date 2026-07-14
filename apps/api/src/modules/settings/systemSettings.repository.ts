import { prisma } from '../../database/prisma';

export const systemSettingsRepository = {
  findByKey(key: string) {
    return prisma.systemSetting.findUnique({ where: { key } });
  },

  upsert(key: string, value: string) {
    return prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  },
};
