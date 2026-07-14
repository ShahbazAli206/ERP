import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

/**
 * Phase 8.11 / 9 — Reports module. Every report endpoint under `/api/reports/*` is read-only
 * (see `apps/api/src/modules/reports/reports.routes.ts`); the sales/purchase reports are
 * paginated, the rest return their full result in one response. Every endpoint additionally
 * accepts `?format=pdf|excel` (Phase 9) which streams a file instead of JSON — `reportsApi.export`
 * below drives that via `apiClient.download`, never `apiClient.get`.
 */

export interface DateRangeParams {
  from: string;
  to: string;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  total: number;
}

// ---- Sales report ----
export interface SalesReportRow {
  id: string;
  orderNumber: string;
  orderDate: string;
  distributorId: string;
  distributorName: string;
  status: string;
  totalAmount: number;
}
export interface SalesReportParams extends DateRangeParams, ListQueryParams {
  status?: string;
  distributorId?: string;
}
export interface SalesReportSummary {
  orderCount: number;
  grandTotal: number;
  byStatus: StatusBreakdown[];
}

// ---- Purchase report ----
export interface PurchaseReportRow {
  id: string;
  poNumber: string;
  orderDate: string;
  supplierId: string;
  supplierName: string;
  status: string;
  currency: string;
  exchangeRateToBase: number;
  totalAmount: number;
  totalAmountBase: number;
}
export interface PurchaseReportParams extends DateRangeParams, ListQueryParams {
  status?: string;
  supplierId?: string;
}
export interface PurchaseReportSummary {
  orderCount: number;
  grandTotal: number;
  byStatus: StatusBreakdown[];
}

// ---- Inventory report ----
export interface InventoryReportLine {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  valuationTotal: number;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  nearestExpiryDate: string | null;
}
export interface InventoryReport {
  lines: InventoryReportLine[];
  grandTotal: number;
}

// ---- Profit report ----
export interface ProfitReport {
  income: number;
  cogs: number;
  expenses: number;
  netProfit: number;
}

// ---- Cash flow report ----
export interface CashFlowDay {
  date: string;
  incoming: number;
  outgoing: number;
  net: number;
}
export interface CashFlowReport {
  incoming: number;
  outgoing: number;
  netCashFlow: number;
  byDate: CashFlowDay[];
}

// ---- Supplier / Distributor reports ----
export interface SupplierReportRow {
  supplierId: string;
  name: string;
  country: string;
  currency: string;
  totalCommittedPurchaseValue: number;
  outstandingBalance: number;
  purchaseOrderCount: number;
}
export interface DistributorReportRow {
  distributorId: string;
  name: string;
  region: string;
  pricingGroupName: string | null;
  totalCommittedSalesValue: number;
  outstandingBalance: number;
  salesOrderCount: number;
}

// ---- Expense report ----
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

// ---- Tax report ----
export interface TaxReportBreakdown {
  taxId: string;
  name: string;
  type: string;
  rate: number;
  isActive: boolean;
  estimatedLiability: number;
}
export interface TaxReport {
  totalInvoicedAmount: number;
  activeGstRatePercent: number | null;
  estimatedTaxLiability: number;
  breakdown: TaxReportBreakdown[];
}

export type ReportKind =
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'profit'
  | 'cash-flow'
  | 'suppliers'
  | 'distributors'
  | 'expenses'
  | 'tax';

export interface SalesReportResult {
  rows: SalesReportRow[];
  summary: SalesReportSummary;
}
export interface PurchaseReportResult {
  rows: PurchaseReportRow[];
  summary: PurchaseReportSummary;
}

export const reportsApi = {
  /**
   * Sales/purchase reports come back as `{ rows, summary }` (see `reports.dto.ts`'s
   * `SalesReportDto`/`PurchaseReportDto`), not a bare array — the API paginates `rows` server-
   * side per `page`/`pageSize`, but the *envelope* isn't the standard `PaginatedResult` shape
   * `apiClient.getPaginated` expects (that helper assumes `data` itself is the array). Use
   * plain `apiClient.get` and read `summary.orderCount` as the row-count total for the table.
   */
  sales: (params: SalesReportParams) => apiClient.get<SalesReportResult>('/reports/sales', { ...params }),
  purchases: (params: PurchaseReportParams) =>
    apiClient.get<PurchaseReportResult>('/reports/purchases', { ...params }),
  inventory: (params: { warehouseId?: string; expiryWithinDays?: number }) =>
    apiClient.get<InventoryReport>('/reports/inventory', { ...params }),
  profit: (params: DateRangeParams) => apiClient.get<ProfitReport>('/reports/profit', { ...params }),
  cashFlow: (params: DateRangeParams) => apiClient.get<CashFlowReport>('/reports/cash-flow', { ...params }),
  suppliers: () => apiClient.get<SupplierReportRow[]>('/reports/suppliers'),
  distributors: () => apiClient.get<DistributorReportRow[]>('/reports/distributors'),
  expenses: (params: DateRangeParams) => apiClient.get<ExpenseReport>('/reports/expenses', { ...params }),
  tax: () => apiClient.get<TaxReport>('/reports/tax'),

  /** Triggers a browser download of the PDF/Excel export for the given report + current filters. */
  export: (kind: ReportKind, format: 'pdf' | 'excel', params: Record<string, string | number | undefined>) =>
    apiClient.download(`/reports/${kind}`, { ...params, format }, `${kind}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`),
};
