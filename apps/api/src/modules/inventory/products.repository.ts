import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';
import { toSkipTake } from '../../shared/pagination';
import type { ListProductsQuery } from './products.validation';

export const productsRepository = {
  async list(query: ListProductsQuery) {
    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { sku: { contains: query.search } },
              { barcode: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake(query),
        include: { category: { select: { name: true } }, inventoryLots: true },
      }),
    ]);

    return { total, products };
  },

  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        inventoryLots: { include: { warehouse: true }, orderBy: { receivedAt: 'asc' } },
      },
    });
  },

  findBySku(sku: string) {
    return prisma.product.findUnique({ where: { sku } });
  },

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({
      include: { category: { select: { name: true } }, inventoryLots: true },
      data,
    });
  },

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { name: true } },
        inventoryLots: { include: { warehouse: true }, orderBy: { receivedAt: 'asc' } },
      },
    });
  },

  deactivate(id: string) {
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  },
};

export type ProductWithLots = NonNullable<Awaited<ReturnType<typeof productsRepository.findById>>>;
