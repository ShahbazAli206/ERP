import type { CashFlowDto, ProfitLossDto } from '../finance/reports.dto';
import type { ExpenseReportDto } from '../expenses/expenses.dto';

/**
 * Profit/Cash Flow/Expense Report are thin proxies over Finance's and Expenses' own DTOs —
 * re-exported under this module's own names purely so callers of /api/reports/* don't need to
 * reach into another module's dto file, per IMPLEMENTATION_PLAN.md Phase 3.11. The shape is
 * identical; no fields are added or removed.
 */
export type ProfitReportDto = ProfitLossDto;
export type CashFlowReportDto = CashFlowDto;
export type ExpenseReportProxyDto = ExpenseReportDto;

export interface StatusBreakdownDto {
  status: string;
  count: number;
  total: number;
}

// ---- Sales Report ----
export interface SalesReportRowDto {
  id: string;
  orderNumber: string;
  orderDate: Date;
  distributorId: string;
  distributorName: string;
  status: string;
  totalAmount: number;
}

export interface SalesReportSummaryDto {
  orderCount: number;
  grandTotal: number;
  byStatus: StatusBreakdownDto[];
}

export interface SalesReportDto {
  rows: SalesReportRowDto[];
  summary: SalesReportSummaryDto;
}

// ---- Purchase Report ----
export interface PurchaseReportRowDto {
  id: string;
  poNumber: string;
  orderDate: Date;
  supplierId: string;
  supplierName: string;
  status: string;
  currency: string;
  exchangeRateToBase: number;
  /** Total in the PO's own transaction currency (what the PO document itself says). */
  totalAmount: number;
  /** totalAmount converted to base currency via exchangeRateToBase — what summary.grandTotal sums. */
  totalAmountBase: number;
}

export interface PurchaseReportSummaryDto {
  orderCount: number;
  grandTotal: number;
  byStatus: StatusBreakdownDto[];
}

export interface PurchaseReportDto {
  rows: PurchaseReportRowDto[];
  summary: PurchaseReportSummaryDto;
}

// ---- Inventory Report ----
export interface InventoryReportLineDto {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  valuationTotal: number;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  nearestExpiryDate: Date | null;
}

export interface InventoryReportDto {
  lines: InventoryReportLineDto[];
  grandTotal: number;
}

// ---- Supplier Report ----
export interface SupplierReportRowDto {
  supplierId: string;
  name: string;
  country: string;
  currency: string;
  totalCommittedPurchaseValue: number;
  outstandingBalance: number;
  purchaseOrderCount: number;
}

// ---- Distributor Report ----
export interface DistributorReportRowDto {
  distributorId: string;
  name: string;
  region: string;
  pricingGroupName: string | null;
  totalCommittedSalesValue: number;
  outstandingBalance: number;
  salesOrderCount: number;
}

// ---- Tax Report ----
export interface TaxReportBreakdownDto {
  taxId: string;
  name: string;
  type: string;
  rate: number;
  isActive: boolean;
  estimatedLiability: number;
}

export interface TaxReportDto {
  totalInvoicedAmount: number;
  activeGstRatePercent: number | null;
  estimatedTaxLiability: number;
  breakdown: TaxReportBreakdownDto[];
}
