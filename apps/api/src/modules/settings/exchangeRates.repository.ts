import { prisma } from '../../database/prisma';

export const exchangeRatesRepository = {
  list() {
    return prisma.exchangeRate.findMany({ orderBy: { currencyCode: 'asc' } });
  },

  findByCurrencyCode(currencyCode: string) {
    return prisma.exchangeRate.findUnique({ where: { currencyCode } });
  },

  create(currencyCode: string, rateToBase: number) {
    return prisma.exchangeRate.create({ data: { currencyCode, rateToBase } });
  },

  upsert(currencyCode: string, rateToBase: number) {
    return prisma.exchangeRate.upsert({
      where: { currencyCode },
      create: { currencyCode, rateToBase },
      update: { rateToBase },
    });
  },

  delete(currencyCode: string) {
    return prisma.exchangeRate.delete({ where: { currencyCode } });
  },
};
