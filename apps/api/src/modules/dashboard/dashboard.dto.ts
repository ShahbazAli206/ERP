import type { CategoryTotal } from '../../shared/analytics';

export interface DashboardKpisDto {
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
  range: { from: Date; to: Date };
}

export interface RevenueTrendPointDto {
  month: string;
  revenue: number;
}

export interface ProfitTrendPointDto {
  month: string;
  profit: number;
}

/** Re-exported so route/controller code doesn't need to reach into shared/analytics.ts directly. */
export type CategoryValueDto = CategoryTotal;

export interface TopSupplierDto {
  supplierId: string;
  name: string;
  totalValue: number;
}

export interface TopDistributorDto {
  distributorId: string;
  name: string;
  totalValue: number;
}

export interface RecentActivityDto {
  id: string;
  entityType: string;
  status: string;
  note: string | null;
  changedAt: Date;
  changedByName: string | null;
  referenceLabel: string | null;
}
