import { ApiError } from '../../shared/ApiError';
import { expenseCategoriesRepository } from './expenseCategories.repository';
import type { ExpenseCategoryDto } from './expenseCategories.dto';
import type {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from './expenseCategories.validation';

export const expenseCategoriesService = {
  async list(): Promise<ExpenseCategoryDto[]> {
    const categories = await expenseCategoriesRepository.list();
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      expenseCount: c._count.expenses,
    }));
  },

  create(input: CreateExpenseCategoryInput) {
    return expenseCategoriesRepository.create(input);
  },

  async update(id: string, input: UpdateExpenseCategoryInput) {
    const existing = await expenseCategoriesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Expense category not found');
    }
    return expenseCategoriesRepository.update(id, input);
  },

  async delete(id: string) {
    const existing = await expenseCategoriesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Expense category not found');
    }
    // Expense.categoryId is a required FK, so expenses referencing this category
    // can't be orphaned the way categories.repository does for products — block instead.
    const expenseCount = await expenseCategoriesRepository.countExpenses(id);
    if (expenseCount > 0) {
      throw ApiError.conflict('Cannot delete a category that still has expenses recorded against it');
    }
    await expenseCategoriesRepository.delete(id);
  },
};
