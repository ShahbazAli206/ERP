'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  categoriesApi,
  productsApi,
  purchaseOrdersRefApi,
  stockApi,
  warehousesApi,
  type CategoryInput,
  type GoodsReceiptInput,
  type ProductInput,
  type ProductListParams,
  type StockAdjustmentInput,
  type WarehouseInput,
} from './api';

// ── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES_QUERY_KEY = ['inventory', 'categories'] as const;

export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_QUERY_KEY, queryFn: categoriesApi.list });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) => categoriesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    },
  });
}

// ── Warehouses ──────────────────────────────────────────────────────────────

export const WAREHOUSES_QUERY_KEY = ['inventory', 'warehouses'] as const;

export function useWarehouses() {
  return useQuery({ queryKey: WAREHOUSES_QUERY_KEY, queryFn: warehousesApi.list });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WarehouseInput) => warehousesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY }),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WarehouseInput> }) => warehousesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY }),
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehousesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY }),
  });
}

// ── Products ────────────────────────────────────────────────────────────────

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ['inventory', 'products', 'list', params],
    queryFn: () => productsApi.list(params),
  });
}

export function useProduct(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['inventory', 'products', 'detail', id],
    queryFn: () => productsApi.get(id as string),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

/** All active products, unpaginated (for select dropdowns in forms). */
export function useAllProducts() {
  return useQuery({
    queryKey: ['inventory', 'products', 'all'],
    queryFn: () => productsApi.list({ page: 1, pageSize: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' }),
  });
}

function invalidateProductQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => productsApi.create(input),
    onSuccess: () => invalidateProductQueries(queryClient),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) => productsApi.update(id, input),
    onSuccess: () => invalidateProductQueries(queryClient),
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.deactivate(id),
    onSuccess: () => invalidateProductQueries(queryClient),
  });
}

// ── Stock: goods receipt / adjustments / alerts / valuation ─────────────────

export function useGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GoodsReceiptInput) => stockApi.goodsReceipt(input),
    onSuccess: () => {
      invalidateProductQueries(queryClient);
      // A receipt against a PO can flip its status (ORDERED -> PARTIALLY_RECEIVED/RECEIVED),
      // so refresh both the receivable-PO dropdown and any open PO detail.
      queryClient.invalidateQueries({ queryKey: ['inventory', 'goods-receipt'] });
    },
  });
}

export function useStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StockAdjustmentInput) => stockApi.adjust(input),
    onSuccess: () => invalidateProductQueries(queryClient),
  });
}

export function useLowStockAlerts() {
  return useQuery({ queryKey: ['inventory', 'alerts', 'low-stock'], queryFn: stockApi.lowStockAlerts });
}

export function useExpiryAlerts(withinDays = 30) {
  return useQuery({
    queryKey: ['inventory', 'alerts', 'expiring', withinDays],
    queryFn: () => stockApi.expiryAlerts(withinDays),
  });
}

export function useValuation(warehouseId?: string) {
  return useQuery({
    queryKey: ['inventory', 'valuation', warehouseId ?? 'all'],
    queryFn: () => stockApi.valuation(warehouseId),
  });
}

// ── Purchase orders (read-only reference for Goods Receipt linking) ────────

export function useReceivablePurchaseOrders() {
  return useQuery({
    queryKey: ['inventory', 'goods-receipt', 'receivable-pos'],
    queryFn: purchaseOrdersRefApi.listReceivable,
  });
}

export function usePurchaseOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['inventory', 'goods-receipt', 'po-detail', id],
    queryFn: () => purchaseOrdersRefApi.get(id as string),
    enabled: Boolean(id),
  });
}
