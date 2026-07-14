'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { getSessionToken } from '@/lib/session';
import {
  expenseCategoriesApi,
  expensesApi,
  type CreateExpenseInput,
  type ExpenseCategoryInput,
  type ExpenseListParams,
  type UpdateExpenseInput,
} from './api';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

// ── Categories ──────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES_QUERY_KEY = ['expenses', 'categories'] as const;

export function useExpenseCategories() {
  return useQuery({ queryKey: EXPENSE_CATEGORIES_QUERY_KEY, queryFn: expenseCategoriesApi.list });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseCategoryInput) => expenseCategoriesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_QUERY_KEY }),
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ExpenseCategoryInput> }) =>
      expenseCategoriesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_QUERY_KEY }),
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseCategoriesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_QUERY_KEY }),
  });
}

// ── Expenses ────────────────────────────────────────────────────────────────

export const expenseKeys = {
  all: ['expenses', 'list'] as const,
  list: (params: ExpenseListParams) => ['expenses', 'list', params] as const,
  detail: (id: string) => ['expenses', 'detail', id] as const,
};

export function useExpenses(params: ExpenseListParams) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expensesApi.list(params),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expensesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success('Expense recorded.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not record the expense.')),
  });
}

export function useUpdateExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateExpenseInput) => expensesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success('Expense updated.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the expense.')),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success('Expense deleted.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete the expense.')),
  });
}

export function useUploadExpenseAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => expensesApi.uploadAttachment(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      toast.success('Attachment uploaded.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not upload the attachment.')),
  });
}

export function useRemoveExpenseAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => expensesApi.removeAttachment(id, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      toast.success('Attachment removed.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not remove the attachment.')),
  });
}

/**
 * Attachment download isn't a JSON envelope (it's `res.download()` on the API
 * side), so it bypasses `apiClient` and fetches the file directly as a blob,
 * attaching the same bearer token, then triggers a browser download. Mirrors
 * `features/procurement/hooks.ts`'s `downloadAttachment`.
 */
export async function downloadExpenseAttachment(expenseId: string, attachmentId: string, fileName: string) {
  const token = getSessionToken();
  const downloadPath = expensesApi.attachmentDownloadPath(expenseId, attachmentId).replace(/^\/+/, '');
  const response = await fetch(`${API_BASE_URL}/${downloadPath}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error('Download failed');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ── Report ──────────────────────────────────────────────────────────────────

export function useExpenseReport(from: string, to: string) {
  return useQuery({
    queryKey: ['expenses', 'report', from, to],
    queryFn: () => expensesApi.report(from, to),
    enabled: Boolean(from && to),
  });
}
