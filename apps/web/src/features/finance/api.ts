import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

/**
 * Typed API layer for the Finance module — see `apps/api/src/modules/finance/`
 * (accounts/bankAccounts/journalEntries/reports route + `.dto.ts` files) for
 * the exact backend shapes these mirror.
 */

// ── Chart of accounts ────────────────────────────────────────────────────────

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
}

export interface AccountInput {
  code: string;
  name: string;
  type: AccountType;
}

export interface AccountListParams extends ListQueryParams {
  type?: AccountType;
  search?: string;
  sortBy?: 'code' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// ── Bank accounts ────────────────────────────────────────────────────────────

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  balance: number;
}

export interface BankAccountInput {
  name: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  balance: number;
}

export interface BankAccountListParams extends ListQueryParams {
  search?: string;
  sortBy?: 'name' | 'bankName' | 'balance';
  sortOrder?: 'asc' | 'desc';
}

// ── Journal entries ──────────────────────────────────────────────────────────

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntryListItem {
  id: string;
  entryDate: string;
  description: string | null;
  reference: string | null;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

export interface JournalEntryDetail extends JournalEntryListItem {
  lines: JournalLine[];
}

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
}

export interface CreateJournalEntryInput {
  /** ISO date string — the create form converts its `Date` field with `.toISOString()` before sending. */
  entryDate?: string;
  description?: string;
  reference?: string;
  lines: JournalLineInput[];
}

export interface JournalEntryListParams extends ListQueryParams {
  sortBy?: 'entryDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ── Reports ──────────────────────────────────────────────────────────────────

export interface Receivable {
  distributorId: string;
  name: string;
  outstandingBalance: number;
}

export interface Payable {
  supplierId: string;
  name: string;
  outstandingBalance: number;
}

export interface CashPosition {
  totalBalance: number;
}

export interface ProfitLoss {
  income: number;
  cogs: number;
  expenses: number;
  netProfit: number;
}

export interface BalanceSheet {
  assets: number;
  liabilities: number;
  equity: number;
}

export interface CashFlowDay {
  date: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface CashFlow {
  incoming: number;
  outgoing: number;
  netCashFlow: number;
  byDate: CashFlowDay[];
}

export interface DateRangeParams {
  from: string;
  to: string;
}

export const accountsApi = {
  list: (params: AccountListParams) => apiClient.getPaginated<Account>('/finance/accounts', { ...params }),
  get: (id: string) => apiClient.get<Account>(`/finance/accounts/${id}`),
  create: (input: AccountInput) => apiClient.post<Account>('/finance/accounts', input),
  update: (id: string, input: Partial<AccountInput>) => apiClient.patch<Account>(`/finance/accounts/${id}`, input),
  remove: (id: string) => apiClient.delete(`/finance/accounts/${id}`),
};

export const bankAccountsApi = {
  list: (params: BankAccountListParams) => apiClient.getPaginated<BankAccount>('/finance/bank-accounts', { ...params }),
  get: (id: string) => apiClient.get<BankAccount>(`/finance/bank-accounts/${id}`),
  create: (input: BankAccountInput) => apiClient.post<BankAccount>('/finance/bank-accounts', input),
  update: (id: string, input: Partial<BankAccountInput>) =>
    apiClient.patch<BankAccount>(`/finance/bank-accounts/${id}`, input),
  remove: (id: string) => apiClient.delete(`/finance/bank-accounts/${id}`),
};

export const journalEntriesApi = {
  list: (params: JournalEntryListParams) =>
    apiClient.getPaginated<JournalEntryListItem>('/finance/journal-entries', { ...params }),
  get: (id: string) => apiClient.get<JournalEntryDetail>(`/finance/journal-entries/${id}`),
  create: (input: CreateJournalEntryInput) => apiClient.post<JournalEntryDetail>('/finance/journal-entries', input),
};

export const reportsApi = {
  receivables: () => apiClient.get<Receivable[]>('/finance/receivables'),
  payables: () => apiClient.get<Payable[]>('/finance/payables'),
  cashPosition: () => apiClient.get<CashPosition>('/finance/cash-position'),
  profitLoss: (range: DateRangeParams) => apiClient.get<ProfitLoss>('/finance/profit-loss', { ...range }),
  balanceSheet: () => apiClient.get<BalanceSheet>('/finance/balance-sheet'),
  cashFlow: (range: DateRangeParams) => apiClient.get<CashFlow>('/finance/cash-flow', { ...range }),
};
