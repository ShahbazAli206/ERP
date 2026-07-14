import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';

export const companySettingsRepository = {
  findFirst() {
    return prisma.companySetting.findFirst();
  },

  create(data: Prisma.CompanySettingCreateInput) {
    return prisma.companySetting.create({ data });
  },

  update(id: string, data: Prisma.CompanySettingUpdateInput) {
    return prisma.companySetting.update({ where: { id }, data });
  },
};
