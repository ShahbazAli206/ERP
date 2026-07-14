import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardRangeParams } from './api';

/**
 * One React Query hook per dashboard endpoint, following `features/auth/use-auth.tsx`'s
 * pattern. The 30s app-wide `staleTime` (see `src/lib/query-provider.tsx`) is fine as-is for
 * dashboard data, so no per-query overrides here.
 */

export function useDashboardKpis(range?: DashboardRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', range ?? null],
    queryFn: () => dashboardApi.kpis(range),
  });
}

export function useRevenueTrend() {
  return useQuery({
    queryKey: ['dashboard', 'revenue-trend'],
    queryFn: () => dashboardApi.revenueTrend(),
  });
}

export function useProfitTrend() {
  return useQuery({
    queryKey: ['dashboard', 'profit-trend'],
    queryFn: () => dashboardApi.profitTrend(),
  });
}

export function useInventoryValueByCategory() {
  return useQuery({
    queryKey: ['dashboard', 'inventory-value'],
    queryFn: () => dashboardApi.inventoryValueByCategory(),
  });
}

export function useSalesByCategory(range?: DashboardRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'sales-by-category', range ?? null],
    queryFn: () => dashboardApi.salesByCategory(range),
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: () => dashboardApi.topProducts(),
  });
}

export function useTopSuppliers() {
  return useQuery({
    queryKey: ['dashboard', 'top-suppliers'],
    queryFn: () => dashboardApi.topSuppliers(),
  });
}

export function useDistributorPerformance() {
  return useQuery({
    queryKey: ['dashboard', 'distributor-performance'],
    queryFn: () => dashboardApi.distributorPerformance(),
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: () => dashboardApi.recentActivities(),
  });
}
