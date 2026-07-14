'use client';

import { useQuery } from '@tanstack/react-query';
import {
  reportsApi,
  type DateRangeParams,
  type PurchaseReportParams,
  type SalesReportParams,
} from './api';

export function useSalesReport(params: SalesReportParams) {
  return useQuery({ queryKey: ['reports', 'sales', params], queryFn: () => reportsApi.sales(params) });
}

export function usePurchaseReport(params: PurchaseReportParams) {
  return useQuery({ queryKey: ['reports', 'purchases', params], queryFn: () => reportsApi.purchases(params) });
}

export function useInventoryReport(params: { warehouseId?: string; expiryWithinDays?: number }) {
  return useQuery({ queryKey: ['reports', 'inventory', params], queryFn: () => reportsApi.inventory(params) });
}

export function useProfitReport(params: DateRangeParams) {
  return useQuery({ queryKey: ['reports', 'profit', params], queryFn: () => reportsApi.profit(params) });
}

export function useCashFlowReport(params: DateRangeParams) {
  return useQuery({ queryKey: ['reports', 'cash-flow', params], queryFn: () => reportsApi.cashFlow(params) });
}

export function useSupplierReport() {
  return useQuery({ queryKey: ['reports', 'suppliers'], queryFn: () => reportsApi.suppliers() });
}

export function useDistributorReport() {
  return useQuery({ queryKey: ['reports', 'distributors'], queryFn: () => reportsApi.distributors() });
}

export function useExpenseReport(params: DateRangeParams) {
  return useQuery({ queryKey: ['reports', 'expenses', params], queryFn: () => reportsApi.expenses(params) });
}

export function useTaxReport() {
  return useQuery({ queryKey: ['reports', 'tax'], queryFn: () => reportsApi.tax() });
}
