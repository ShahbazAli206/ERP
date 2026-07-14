import { apiClient } from '@/lib/api-client';
import type { PurchaseOrderStatus } from './status';

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

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  lineTotal: number;
}

export interface PurchaseOrderAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface StatusHistoryEntry {
  status: PurchaseOrderStatus;
  note: string | null;
  changedAt: string;
  changedByName: string | null;
}

export interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  currency: string;
  exchangeRateToBase: number;
  orderDate: string;
  expectedArrival: string | null;
  notes: string | null;
  supplier: { id: string; name: string; country: string; currency: string };
  createdByName: string;
  approvedByName: string | null;
  items: PurchaseOrderItem[];
  attachments: PurchaseOrderAttachment[];
  statusHistory: StatusHistoryEntry[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderListParams {
  page?: number;
  pageSize?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  search?: string;
  sortBy?: 'orderDate' | 'createdAt' | 'poNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  currency: string;
  exchangeRateToBase: number;
  expectedArrival?: string;
  notes?: string;
  items: PurchaseOrderItemInput[];
}

export type UpdatePurchaseOrderInput = Partial<Omit<CreatePurchaseOrderInput, 'supplierId'>>;

/**
 * Minimal read-only shapes for the supplier/product pickers used by the PO
 * create/edit form. These deliberately duplicate (a subset of) the
 * Suppliers/Inventory modules' own DTOs rather than importing from their
 * `features/` folders, per this module's isolation boundary — Suppliers and
 * Inventory are being built concurrently in sibling folders.
 */
export interface SupplierOption {
  id: string;
  name: string;
  country: string;
  currency: string;
  isActive: boolean;
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costPrice: number;
  isActive: boolean;
}

const BASE_PATH = '/procurement/purchase-orders';

export const procurementApi = {
  list: (params: PurchaseOrderListParams) =>
    apiClient.getPaginated<PurchaseOrderListItem>(BASE_PATH, { ...params }),

  get: (id: string) => apiClient.get<PurchaseOrderDetail>(`${BASE_PATH}/${id}`),

  create: (input: CreatePurchaseOrderInput) => apiClient.post<PurchaseOrderDetail>(BASE_PATH, input),

  update: (id: string, input: UpdatePurchaseOrderInput) =>
    apiClient.patch<PurchaseOrderDetail>(`${BASE_PATH}/${id}`, input),

  remove: (id: string) => apiClient.delete(`${BASE_PATH}/${id}`),

  submit: (id: string) => apiClient.post<PurchaseOrderDetail>(`${BASE_PATH}/${id}/submit`),

  approve: (id: string) => apiClient.post<PurchaseOrderDetail>(`${BASE_PATH}/${id}/approve`),

  reject: (id: string, reason: string) =>
    apiClient.post<PurchaseOrderDetail>(`${BASE_PATH}/${id}/reject`, { reason }),

  markOrdered: (id: string) => apiClient.post<PurchaseOrderDetail>(`${BASE_PATH}/${id}/mark-ordered`),

  cancel: (id: string) => apiClient.post<PurchaseOrderDetail>(`${BASE_PATH}/${id}/cancel`),

  uploadAttachment: (id: string, file: File) =>
    apiClient.upload<PurchaseOrderAttachment>(`${BASE_PATH}/${id}/attachments`, file, 'file'),

  removeAttachment: (id: string, attachmentId: string) =>
    apiClient.delete(`${BASE_PATH}/${id}/attachments/${attachmentId}`),

  /** Returns a same-origin download URL; the browser attaches the auth header via a fetch+blob download (see `useDownloadAttachment`). */
  attachmentDownloadPath: (id: string, attachmentId: string) =>
    `${BASE_PATH}/${id}/attachments/${attachmentId}/download`,

  listSuppliers: () =>
    apiClient.getPaginated<SupplierOption>('/suppliers', { pageSize: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' }),

  listProducts: () =>
    apiClient.getPaginated<ProductOption>('/inventory/products', { pageSize: 100, isActive: true }),
};
