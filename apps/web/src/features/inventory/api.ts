import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

/**
 * Typed API layer for the Inventory module — see `apps/api/src/modules/inventory/`
 * (categories/warehouses/products/stock route files + their `.dto.ts`) for the
 * exact backend shapes these mirror.
 */

// ── Categories ──────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  productCount: number;
}

export interface CategoryInput {
  name: string;
  parentId?: string;
}

// ── Warehouses ──────────────────────────────────────────────────────────────

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
}

export interface WarehouseInput {
  name: string;
  location?: string;
}

// ── Products ────────────────────────────────────────────────────────────────

export interface ProductListItem {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryName: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  stockOnHand: number;
  isLowStock: boolean;
  isActive: boolean;
}

export interface ProductLot {
  id: string;
  warehouseId: string;
  warehouseName: string;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiryDate: string | null;
  receivedAt: string;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  lots: ProductLot[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams extends ListQueryParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'sku' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductInput {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel?: number;
  isActive?: boolean;
}

// ── Stock: goods receipt / adjustments / alerts / valuation ────────────────

export interface GoodsReceiptItemInput {
  productId: string;
  purchaseOrderItemId?: string;
  quantity: number;
  lotNumber: string;
  costPrice: number;
  expiryDate?: string;
}

export interface GoodsReceiptInput {
  purchaseOrderId?: string;
  warehouseId: string;
  items: GoodsReceiptItemInput[];
}

export interface StockAdjustmentInput {
  productId: string;
  warehouseId: string;
  /** Positive to increase, negative to decrease (decreases consume FIFO server-side). */
  quantityDelta: number;
  reason: string;
  lotNumber?: string;
  costPrice?: number;
  expiryDate?: string;
}

export interface StockMovementResult {
  lotNumber: string;
  quantity: number;
}

/** Raw `InventoryLot` rows created/topped-up by a goods receipt. */
export interface GoodsReceiptResultLot {
  id: string;
  productId: string;
  warehouseId: string;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiryDate: string | null;
  receivedAt: string;
}

export interface LowStockAlert {
  productId: string;
  sku: string;
  name: string;
  stockOnHand: number;
  reorderLevel: number;
}

export interface ExpiryAlert {
  lotId: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseName: string;
  lotNumber: string;
  quantity: number;
  expiryDate: string;
  isExpired: boolean;
  daysUntilExpiry: number;
}

export interface ValuationLine {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  valuationTotal: number;
}

export interface ValuationSummary {
  lines: ValuationLine[];
  grandTotal: number;
}

export const categoriesApi = {
  list: () => apiClient.get<Category[]>('/inventory/categories'),
  create: (input: CategoryInput) => apiClient.post<Category>('/inventory/categories', input),
  update: (id: string, input: Partial<CategoryInput>) =>
    apiClient.patch<Category>(`/inventory/categories/${id}`, input),
  remove: (id: string) => apiClient.delete(`/inventory/categories/${id}`),
};

export const warehousesApi = {
  list: () => apiClient.get<Warehouse[]>('/inventory/warehouses'),
  create: (input: WarehouseInput) => apiClient.post<Warehouse>('/inventory/warehouses', input),
  update: (id: string, input: Partial<WarehouseInput>) =>
    apiClient.patch<Warehouse>(`/inventory/warehouses/${id}`, input),
  remove: (id: string) => apiClient.delete(`/inventory/warehouses/${id}`),
};

export const productsApi = {
  list: (params: ProductListParams) => apiClient.getPaginated<ProductListItem>('/inventory/products', { ...params }),
  get: (id: string) => apiClient.get<ProductDetail>(`/inventory/products/${id}`),
  create: (input: ProductInput) => apiClient.post<ProductDetail>('/inventory/products', input),
  update: (id: string, input: Partial<ProductInput>) =>
    apiClient.patch<ProductDetail>(`/inventory/products/${id}`, input),
  deactivate: (id: string) => apiClient.delete(`/inventory/products/${id}`),
};

export const stockApi = {
  goodsReceipt: (input: GoodsReceiptInput) =>
    apiClient.post<GoodsReceiptResultLot[]>('/inventory/goods-receipts', input),
  adjust: (input: StockAdjustmentInput) =>
    apiClient.post<StockMovementResult[]>('/inventory/adjustments', input),
  lowStockAlerts: () => apiClient.get<LowStockAlert[]>('/inventory/alerts/low-stock'),
  expiryAlerts: (withinDays?: number) =>
    apiClient.get<ExpiryAlert[]>('/inventory/alerts/expiring', { withinDays }),
  valuation: (warehouseId?: string) =>
    apiClient.get<ValuationSummary>('/inventory/valuation', { warehouseId }),
};

// ── Minimal cross-module read for Goods Receipt's optional PO link ─────────
// Read-only reference into the Procurement module's own API (owned by another
// agent's `src/features/procurement/`) — kept local here since Goods Receipt
// needs to let the user pick an open PO and see its lines. Does not touch any
// file under `src/features/procurement/` or `src/app/(app)/procurement/`.

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  currency: string;
  orderDate: string;
  expectedArrival: string | null;
  totalAmount: number;
  createdAt: string;
}

export interface PurchaseOrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  lineTotal: number;
}

export interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItemDetail[];
}

export const purchaseOrdersRefApi = {
  /** Only ORDERED/PARTIALLY_RECEIVED POs can accept a goods receipt (see stock.repository.ts). */
  listReceivable: async (): Promise<PurchaseOrderListItem[]> => {
    const [ordered, partial] = await Promise.all([
      apiClient.getPaginated<PurchaseOrderListItem>('/procurement/purchase-orders', {
        status: 'ORDERED',
        pageSize: 100,
      }),
      apiClient.getPaginated<PurchaseOrderListItem>('/procurement/purchase-orders', {
        status: 'PARTIALLY_RECEIVED',
        pageSize: 100,
      }),
    ]);
    return [...ordered.data, ...partial.data];
  },
  get: (id: string) => apiClient.get<PurchaseOrderDetail>(`/procurement/purchase-orders/${id}`),
};
