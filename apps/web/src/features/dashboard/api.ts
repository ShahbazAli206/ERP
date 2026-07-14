import { apiClient, type QueryParams } from '@/lib/api-client';

/** Mirrors `DashboardKpisDto` in `apps/api/src/modules/dashboard/dashboard.dto.ts`. */
export interface DashboardKpis {
  totalRevenue: number;
  netProfit: number;
  grossProfit: number;
  cashPosition: number;
  inventoryValue: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  lowStockCount: number;
  shipmentsInTransitCount: number;
  pendingPurchaseOrdersCount: number;
  range: { from: string; to: string };
}

/**
 * `?from&to` — both optional; the API defaults to the trailing 12 months when omitted.
 * Extends `QueryParams`'s index signature directly (rather than a plain `{ from?; to? }`
 * interface) so it's structurally assignable to `apiClient.get`'s `params` argument — a named
 * interface without an index signature isn't assignable to `Record<string, QueryParamValue>`.
 */
export interface DashboardRangeParams extends QueryParams {
  from?: string;
  to?: string;
}

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export interface ProfitTrendPoint {
  month: string;
  profit: number;
}

/** Shared shape for both category-breakdown endpoints (`CategoryTotal` on the API side). */
export interface CategoryValue {
  categoryId: string | null;
  categoryName: string;
  total: number;
}

export interface TopProduct {
  productId: string;
  sku: string;
  name: string;
  quantitySold: number;
}

export interface TopSupplier {
  supplierId: string;
  name: string;
  totalValue: number;
}

export interface TopDistributor {
  distributorId: string;
  name: string;
  totalValue: number;
}

/** Mirrors `RecentActivityDto` — a single status-change event on a PO/shipment/sales order. */
export interface RecentActivity {
  id: string;
  entityType: string;
  status: string;
  note: string | null;
  changedAt: string;
  changedByName: string | null;
  referenceLabel: string | null;
}

export const dashboardApi = {
  kpis: (range?: DashboardRangeParams) => apiClient.get<DashboardKpis>('/dashboard/kpis', range),
  revenueTrend: () => apiClient.get<RevenueTrendPoint[]>('/dashboard/charts/revenue-trend'),
  profitTrend: () => apiClient.get<ProfitTrendPoint[]>('/dashboard/charts/profit-trend'),
  inventoryValueByCategory: () => apiClient.get<CategoryValue[]>('/dashboard/charts/inventory-value'),
  salesByCategory: (range?: DashboardRangeParams) =>
    apiClient.get<CategoryValue[]>('/dashboard/charts/sales-by-category', range),
  topProducts: () => apiClient.get<TopProduct[]>('/dashboard/charts/top-products'),
  topSuppliers: () => apiClient.get<TopSupplier[]>('/dashboard/charts/top-suppliers'),
  distributorPerformance: () => apiClient.get<TopDistributor[]>('/dashboard/charts/distributor-performance'),
  recentActivities: () => apiClient.get<RecentActivity[]>('/dashboard/charts/recent-activities'),
};
