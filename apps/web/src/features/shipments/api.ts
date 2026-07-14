import { apiClient } from '@/lib/api-client';
import type { QueryParamValue } from '@/lib/api-client';
import type { PaginatedResult } from '@/types/api';
import type {
  CreateShipmentFormValues,
  UpdateShipmentFormValues,
  UpdateShipmentStatusFormValues,
} from './schemas';

/** Mirrors `ShipmentListItemDto` in `apps/api/src/modules/shipments/shipments.dto.ts`. */
export interface ShipmentListItem {
  id: string;
  shipmentNumber: string;
  containerNumber: string | null;
  originPort: string;
  destinationPort: string;
  status: string;
  estimatedArrival: string | null;
  actualArrival: string | null;
  purchaseOrderId: string | null;
  poNumber: string | null;
  createdAt: string;
}

/** Mirrors `LandedCostItemDto`. */
export interface LandedCostItem {
  productId: string;
  productName: string;
  quantity: number;
  poUnitCost: number | null;
  allocatedLandedCostBase: number;
  landedUnitCostBase: number;
}

/** Mirrors `LandedCostSummaryDto`. */
export interface LandedCostSummary {
  freightCost: number;
  insuranceCost: number;
  dutyCost: number;
  customsCharges: number;
  currency: string;
  exchangeRateToBase: number;
  totalAdditionalCostBase: number;
  items: LandedCostItem[];
}

/** Mirrors `ShipmentDetailDto`. */
export interface ShipmentDetail {
  id: string;
  shipmentNumber: string;
  containerNumber: string | null;
  originPort: string;
  destinationPort: string;
  status: string;
  estimatedArrival: string | null;
  actualArrival: string | null;
  currency: string;
  purchaseOrderId: string | null;
  poNumber: string | null;
  items: Array<{ productId: string; productName: string; productSku: string; quantity: number }>;
  statusHistory: Array<{
    status: string;
    note: string | null;
    changedAt: string;
    changedByName: string | null;
  }>;
  landedCostSummary: LandedCostSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  purchaseOrderId?: string;
  search?: string;
  sortBy?: 'estimatedArrival' | 'createdAt' | 'shipmentNumber';
  sortOrder?: 'asc' | 'desc';
  [key: string]: QueryParamValue | undefined;
}

export const shipmentsApi = {
  list: (params: ShipmentListParams): Promise<PaginatedResult<ShipmentListItem>> =>
    apiClient.getPaginated<ShipmentListItem>('/shipments', params),
  get: (id: string) => apiClient.get<ShipmentDetail>(`/shipments/${id}`),
  create: (input: CreateShipmentFormValues) => apiClient.post<ShipmentDetail>('/shipments', input),
  update: (id: string, input: UpdateShipmentFormValues) =>
    apiClient.patch<ShipmentDetail>(`/shipments/${id}`, input),
  updateStatus: (id: string, input: UpdateShipmentStatusFormValues) =>
    apiClient.post<ShipmentDetail>(`/shipments/${id}/status`, input),
  remove: (id: string) => apiClient.delete(`/shipments/${id}`),
};

/**
 * Minimal option lookups for the create/edit forms' selects. These hit other
 * modules' read endpoints (purchase orders, products) but stay entirely
 * within this feature's own `api.ts` — no cross-module frontend imports.
 */
export interface PurchaseOrderOption {
  id: string;
  poNumber: string;
  status: string;
  supplierName: string;
  currency: string;
}

export interface PurchaseOrderItemOption {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrderOptionDetail extends PurchaseOrderOption {
  items: PurchaseOrderItemOption[];
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  isActive: boolean;
}

interface RawPurchaseOrderListItem {
  id: string;
  poNumber: string;
  status: string;
  supplierName: string;
  currency: string;
}

interface RawPurchaseOrderDetail extends RawPurchaseOrderListItem {
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface RawProductListItem {
  id: string;
  sku: string;
  name: string;
  isActive: boolean;
}

export const shipmentRelatedApi = {
  /** All purchase orders, for the "link to a PO" select on the create form. */
  // The API caps `pageSize` at 100 (see `apps/api/src/shared/pagination.ts`) — fine for this
  // demo's option lists (100 POs / 50 products seeded), but a real deployment with more than
  // 100 of either would need a searchable/paginated combobox instead of one big select.
  purchaseOrderOptions: async (): Promise<PurchaseOrderOption[]> => {
    const result = await apiClient.getPaginated<RawPurchaseOrderListItem>('/procurement/purchase-orders', {
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    return result.data;
  },
  purchaseOrder: (id: string) => apiClient.get<RawPurchaseOrderDetail>(`/procurement/purchase-orders/${id}`),
  productOptions: async (): Promise<ProductOption[]> => {
    const result = await apiClient.getPaginated<RawProductListItem>('/inventory/products', {
      pageSize: 100,
      isActive: true,
    });
    return result.data;
  },
};
