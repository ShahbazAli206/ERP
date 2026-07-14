import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

/**
 * Typed API layer for the Expenses module — mirrors
 * `apps/api/src/modules/expenses/{expenseCategories,expenses}.{dto,validation}.ts`.
 *
 * Note: the API's `Expense` model has no `currency` field — all amounts are
 * recorded in the system's single base currency (PKR; see
 * `apps/api/src/modules/settings/companySettings.service.ts` and the
 * dashboard's `formatCurrencyCompact`), so there's no currency picker here.
 */

// ── Categories ──────────────────────────────────────────────────────────────

export interface ExpenseCategory {
  id: string;
  name: string;
  expenseCount: number;
}

export interface ExpenseCategoryInput {
  name: string;
}

// ── Expenses ────────────────────────────────────────────────────────────────

export interface ExpenseAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface ExpenseListItem {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  createdByName: string;
  createdAt: string;
  attachmentCount: number;
}

export interface ExpenseDetail {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  attachments: ExpenseAttachment[];
}

export interface ExpenseListParams extends ListQueryParams {
  categoryId?: string;
  search?: string;
  from?: string;
  to?: string;
  sortBy?: 'expenseDate' | 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateExpenseInput {
  categoryId: string;
  amount: number;
  description?: string;
  expenseDate?: string;
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface ExpenseReportItem {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface ExpenseReport {
  from: string;
  to: string;
  items: ExpenseReportItem[];
  grandTotal: number;
}

const CATEGORIES_PATH = '/expenses/categories';
const BASE_PATH = '/expenses';

export const expenseCategoriesApi = {
  list: () => apiClient.get<ExpenseCategory[]>(CATEGORIES_PATH),
  create: (input: ExpenseCategoryInput) => apiClient.post<ExpenseCategory>(CATEGORIES_PATH, input),
  update: (id: string, input: Partial<ExpenseCategoryInput>) =>
    apiClient.patch<ExpenseCategory>(`${CATEGORIES_PATH}/${id}`, input),
  remove: (id: string) => apiClient.delete(`${CATEGORIES_PATH}/${id}`),
};

export const expensesApi = {
  list: (params: ExpenseListParams) => apiClient.getPaginated<ExpenseListItem>(BASE_PATH, { ...params }),

  get: (id: string) => apiClient.get<ExpenseDetail>(`${BASE_PATH}/${id}`),

  create: (input: CreateExpenseInput) => apiClient.post<ExpenseDetail>(BASE_PATH, input),

  update: (id: string, input: UpdateExpenseInput) => apiClient.patch<ExpenseDetail>(`${BASE_PATH}/${id}`, input),

  remove: (id: string) => apiClient.delete(`${BASE_PATH}/${id}`),

  uploadAttachment: (id: string, file: File) =>
    apiClient.upload<ExpenseAttachment>(`${BASE_PATH}/${id}/attachments`, file, 'file'),

  removeAttachment: (id: string, attachmentId: string) =>
    apiClient.delete(`${BASE_PATH}/${id}/attachments/${attachmentId}`),

  /** Returns a same-origin download path; actual fetch+blob download happens in `downloadAttachment` (hooks.ts). */
  attachmentDownloadPath: (id: string, attachmentId: string) => `${BASE_PATH}/${id}/attachments/${attachmentId}/download`,

  report: (from: string, to: string) => apiClient.get<ExpenseReport>(`${BASE_PATH}/report`, { from, to }),
};
