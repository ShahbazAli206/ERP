import { ApiError } from '../../shared/ApiError';
import { categoriesRepository } from './categories.repository';
import type { CategoryDto } from './categories.dto';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.validation';

export const categoriesService = {
  async list(): Promise<CategoryDto[]> {
    const categories = await categoriesRepository.list();
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId,
      productCount: c._count.products,
    }));
  },

  async create(input: CreateCategoryInput) {
    return categoriesRepository.create({
      name: input.name,
      parent: input.parentId ? { connect: { id: input.parentId } } : undefined,
    });
  },

  async update(id: string, input: UpdateCategoryInput) {
    const existing = await categoriesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Category not found');
    }
    return categoriesRepository.update(id, {
      name: input.name,
      parent: input.parentId ? { connect: { id: input.parentId } } : undefined,
    });
  },

  async delete(id: string) {
    const existing = await categoriesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Category not found');
    }
    await categoriesRepository.delete(id);
  },
};
