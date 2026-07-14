'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accountsApi,
  bankAccountsApi,
  journalEntriesApi,
  reportsApi,
  type AccountInput,
  type AccountListParams,
  type BankAccountInput,
  type BankAccountListParams,
  type CreateJournalEntryInput,
  type DateRangeParams,
  type JournalEntryListParams,
} from './api';

// ── Chart of accounts ────────────────────────────────────────────────────────

export function useAccounts(params: AccountListParams) {
  return useQuery({ queryKey: ['finance', 'accounts', 'list', params], queryFn: () => accountsApi.list(params) });
}

/** All accounts, unpaginated (for select dropdowns — journal entry lines). */
export function useAllAccounts() {
  return useQuery({
    queryKey: ['finance', 'accounts', 'all'],
    queryFn: () => accountsApi.list({ page: 1, pageSize: 100, sortBy: 'code', sortOrder: 'asc' }),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInput) => accountsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AccountInput> }) => accountsApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] }),
  });
}

// ── Bank accounts ────────────────────────────────────────────────────────────

export function useBankAccounts(params: BankAccountListParams) {
  return useQuery({
    queryKey: ['finance', 'bank-accounts', 'list', params],
    queryFn: () => bankAccountsApi.list(params),
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BankAccountInput) => bankAccountsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports', 'cash-position'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports', 'balance-sheet'] });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BankAccountInput> }) => bankAccountsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports', 'cash-position'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports', 'balance-sheet'] });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bankAccountsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports', 'cash-position'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports', 'balance-sheet'] });
    },
  });
}

// ── Journal entries ──────────────────────────────────────────────────────────

export function useJournalEntries(params: JournalEntryListParams) {
  return useQuery({
    queryKey: ['finance', 'journal-entries', 'list', params],
    queryFn: () => journalEntriesApi.list(params),
  });
}

export function useJournalEntry(id: string | undefined) {
  return useQuery({
    queryKey: ['finance', 'journal-entries', 'detail', id],
    queryFn: () => journalEntriesApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJournalEntryInput) => journalEntriesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'journal-entries'] });
      // A new entry can move every report total (P&L / balance sheet / cash position) — invalidate them all.
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] });
    },
  });
}

// ── Reports ──────────────────────────────────────────────────────────────────

export function useReceivables() {
  return useQuery({ queryKey: ['finance', 'reports', 'receivables'], queryFn: reportsApi.receivables });
}

export function usePayables() {
  return useQuery({ queryKey: ['finance', 'reports', 'payables'], queryFn: reportsApi.payables });
}

export function useCashPosition() {
  return useQuery({ queryKey: ['finance', 'reports', 'cash-position'], queryFn: reportsApi.cashPosition });
}

export function useProfitLoss(range: DateRangeParams) {
  return useQuery({
    queryKey: ['finance', 'reports', 'profit-loss', range],
    queryFn: () => reportsApi.profitLoss(range),
  });
}

export function useBalanceSheet() {
  return useQuery({ queryKey: ['finance', 'reports', 'balance-sheet'], queryFn: reportsApi.balanceSheet });
}

export function useCashFlow(range: DateRangeParams) {
  return useQuery({
    queryKey: ['finance', 'reports', 'cash-flow', range],
    queryFn: () => reportsApi.cashFlow(range),
  });
}
