import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../database/prisma';

export const categoriesRepository = {
  list() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  },

  findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  async delete(id: string) {
    // Categories have no onDelete cascade on their self-relation or on Product.categoryId,
    // so orphan any children/products pointing here first to avoid an FK violation.
    await prisma.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
    await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    return prisma.category.delete({ where: { id } });
  },
};
