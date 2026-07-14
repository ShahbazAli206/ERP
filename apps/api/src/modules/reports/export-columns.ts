import type { ExportColumn } from './export.util';
import type {
  DistributorReportRowDto,
  InventoryReportLineDto,
  PurchaseReportRowDto,
  SalesReportRowDto,
  SupplierReportRowDto,
  TaxReportBreakdownDto,
} from './reports.dto';
import type { ExpenseReportItemDto } from '../expenses/expenses.dto';
import type { CashFlowDayDto } from '../finance/reports.dto';

const money = (n: number) => Number(n.toFixed(2));
const dateStr = (d: Date) => new Date(d).toISOString().slice(0, 10);

export const salesReportColumns: ExportColumn<SalesReportRowDto>[] = [
  { header: 'Order #', value: (r) => r.orderNumber },
  { header: 'Date', value: (r) => dateStr(r.orderDate) },
  { header: 'Distributor', value: (r) => r.distributorName },
  { header: 'Status', value: (r) => r.status },
  { header: 'Total', value: (r) => money(r.totalAmount) },
];

export const purchaseReportColumns: ExportColumn<PurchaseReportRowDto>[] = [
  { header: 'PO #', value: (r) => r.poNumber },
  { header: 'Date', value: (r) => dateStr(r.orderDate) },
  { header: 'Supplier', value: (r) => r.supplierName },
  { header: 'Status', value: (r) => r.status },
  { header: 'Currency', value: (r) => r.currency },
  { header: 'Total (native)', value: (r) => money(r.totalAmount) },
  { header: 'Total (base)', value: (r) => money(r.totalAmountBase) },
];

export const inventoryReportColumns: ExportColumn<InventoryReportLineDto>[] = [
  { header: 'SKU', value: (r) => r.sku },
  { header: 'Product', value: (r) => r.name },
  { header: 'Qty on hand', value: (r) => r.quantity },
  { header: 'Valuation', value: (r) => money(r.valuationTotal) },
  { header: 'Low stock', value: (r) => (r.isLowStock ? 'Yes' : 'No') },
  { header: 'Expiring soon', value: (r) => (r.isExpiringSoon ? 'Yes' : 'No') },
  { header: 'Nearest expiry', value: (r) => (r.nearestExpiryDate ? dateStr(r.nearestExpiryDate) : '—') },
];

export const supplierReportColumns: ExportColumn<SupplierReportRowDto>[] = [
  { header: 'Supplier', value: (r) => r.name },
  { header: 'Country', value: (r) => r.country },
  { header: 'Currency', value: (r) => r.currency },
  { header: 'Committed purchase value', value: (r) => money(r.totalCommittedPurchaseValue) },
  { header: 'Outstanding balance', value: (r) => money(r.outstandingBalance) },
  { header: 'PO count', value: (r) => r.purchaseOrderCount },
];

export const distributorReportColumns: ExportColumn<DistributorReportRowDto>[] = [
  { header: 'Distributor', value: (r) => r.name },
  { header: 'Region', value: (r) => r.region },
  { header: 'Pricing group', value: (r) => r.pricingGroupName ?? '—' },
  { header: 'Committed sales value', value: (r) => money(r.totalCommittedSalesValue) },
  { header: 'Outstanding balance', value: (r) => money(r.outstandingBalance) },
  { header: 'Order count', value: (r) => r.salesOrderCount },
];

export const expenseReportColumns: ExportColumn<ExpenseReportItemDto>[] = [
  { header: 'Category', value: (r) => r.categoryName },
  { header: 'Total', value: (r) => money(r.total) },
];

export const taxReportColumns: ExportColumn<TaxReportBreakdownDto>[] = [
  { header: 'Tax', value: (r) => r.name },
  { header: 'Type', value: (r) => r.type },
  { header: 'Rate %', value: (r) => r.rate },
  { header: 'Active', value: (r) => (r.isActive ? 'Yes' : 'No') },
  { header: 'Estimated liability', value: (r) => money(r.estimatedLiability) },
];

export const cashFlowReportColumns: ExportColumn<CashFlowDayDto>[] = [
  { header: 'Date', value: (r) => r.date },
  { header: 'Incoming', value: (r) => money(r.incoming) },
  { header: 'Outgoing', value: (r) => money(r.outgoing) },
  { header: 'Net', value: (r) => money(r.net) },
];

/** Profit report has no row list (single aggregate object) — exported as a single-row table. */
export const profitReportColumns: ExportColumn<{ label: string; amount: number }>[] = [
  { header: 'Line', value: (r) => r.label },
  { header: 'Amount', value: (r) => money(r.amount) },
];
