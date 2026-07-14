import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { expenseCategoriesRepository } from './expenseCategories.repository';
import { expensesRepository, type ExpenseDetail } from './expenses.repository';
import type {
  ExpenseAttachmentDto,
  ExpenseDetailDto,
  ExpenseListItemDto,
  ExpenseReportDto,
} from './expenses.dto';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput,
} from './expenses.validation';

function toAttachmentDto(attachment: {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}): ExpenseAttachmentDto {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    uploadedAt: attachment.uploadedAt,
  };
}

function toDetailDto(expense: ExpenseDetail): ExpenseDetailDto {
  return {
    id: expense.id,
    categoryId: expense.categoryId,
    categoryName: expense.category.name,
    amount: expense.amount,
    description: expense.description,
    expenseDate: expense.expenseDate,
    createdById: expense.createdById,
    createdByName: expense.createdBy.name,
    createdAt: expense.createdAt,
    attachments: expense.attachments.map(toAttachmentDto),
  };
}

async function getOrThrow(id: string): Promise<ExpenseDetail> {
  const expense = await expensesRepository.findById(id);
  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }
  return expense;
}

async function assertCategoryExists(categoryId: string) {
  const category = await expenseCategoriesRepository.findById(categoryId);
  if (!category) {
    throw ApiError.badRequest('Expense category not found');
  }
}

export const expensesService = {
  async list(
    query: ListExpensesQuery,
  ): Promise<{ items: ExpenseListItemDto[]; pagination: Pagination }> {
    const { total, expenses } = await expensesRepository.list(query);
    return {
      items: expenses.map((e) => ({
        id: e.id,
        categoryId: e.categoryId,
        categoryName: e.category.name,
        amount: e.amount,
        description: e.description,
        expenseDate: e.expenseDate,
        createdByName: e.createdBy.name,
        createdAt: e.createdAt,
        attachmentCount: e._count.attachments,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getDetail(id: string): Promise<ExpenseDetailDto> {
    return toDetailDto(await getOrThrow(id));
  },

  async create(input: CreateExpenseInput, createdById: string): Promise<ExpenseDetailDto> {
    await assertCategoryExists(input.categoryId);
    const { categoryId, ...rest } = input;
    const created = await expensesRepository.create({
      ...rest,
      category: { connect: { id: categoryId } },
      createdBy: { connect: { id: createdById } },
    });
    return toDetailDto(created);
  },

  async update(id: string, input: UpdateExpenseInput): Promise<ExpenseDetailDto> {
    await getOrThrow(id);
    if (input.categoryId) {
      await assertCategoryExists(input.categoryId);
    }
    const { categoryId, ...rest } = input;
    const updated = await expensesRepository.update(id, {
      ...rest,
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
    });
    return toDetailDto(updated);
  },

  async delete(id: string): Promise<{ id: string; fileUrl: string }[]> {
    const expense = await getOrThrow(id);
    const attachments = expense.attachments.map((a) => ({ id: a.id, fileUrl: a.fileUrl }));
    // Attachment rows cascade-delete with the expense, but the physical files on disk
    // do not — the caller must remove those itself after this resolves.
    await expensesRepository.delete(id);
    return attachments;
  },

  async addAttachment(
    id: string,
    file: { fileName: string; fileUrl: string; fileSize: number; mimeType: string },
  ) {
    await getOrThrow(id);
    return expensesRepository.addAttachment(id, file);
  },

  async getAttachmentForDownload(expenseId: string, attachmentId: string) {
    await getOrThrow(expenseId);
    const attachment = await expensesRepository.findAttachment(attachmentId);
    if (!attachment || attachment.expenseId !== expenseId) {
      throw ApiError.notFound('Attachment not found');
    }
    return attachment;
  },

  async removeAttachment(expenseId: string, attachmentId: string) {
    const attachment = await this.getAttachmentForDownload(expenseId, attachmentId);
    await expensesRepository.removeAttachment(attachmentId);
    return attachment;
  },

  async report(from: Date, to: Date): Promise<ExpenseReportDto> {
    const items = await expensesRepository.reportByCategory(from, to);
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
    return { from, to, items, grandTotal };
  },
};
