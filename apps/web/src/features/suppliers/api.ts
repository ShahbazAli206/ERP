import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

/** Mirrors `SupplierListItemDto` in `apps/api/src/modules/suppliers/suppliers.dto.ts`. */
export interface SupplierListItem {
  id: string;
  name: string;
  country: string;
  currency: string;
  isActive: boolean;
  contactCount: number;
  createdAt: string;
}

/** Mirrors `SupplierContactDto`. */
export interface SupplierContact {
  id: string;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
}

/** Mirrors `SupplierPurchaseHistoryItemDto`. */
export interface SupplierPurchaseHistoryItem {
  purchaseOrderId: string;
  poNumber: string;
  status: string;
  orderDate: string;
  totalAmount: number;
}

export interface SupplierProduct {
  id: string;
  sku: string;
  name: string;
}

/** Mirrors `SupplierProfileDto` — the shape returned by `GET /suppliers/:id`. */
export interface SupplierProfile {
  id: string;
  name: string;
  country: string;
  currency: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contacts: SupplierContact[];
  products: SupplierProduct[];
  purchaseHistory: SupplierPurchaseHistoryItem[];
  outstandingBalance: number;
}

/**
 * Shape returned by create/update — the repository's raw record (includes
 * `contacts` but none of the profile's derived fields like
 * `outstandingBalance`/`products`/`purchaseHistory`), distinct from
 * `SupplierProfile`.
 */
export interface SupplierRecord {
  id: string;
  name: string;
  country: string;
  currency: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contacts: SupplierContact[];
}

export interface SupplierListParams extends ListQueryParams {
  search?: string;
  country?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'country';
  sortOrder?: 'asc' | 'desc';
}

/** Matches `createSupplierSchema` in `suppliers.validation.ts`. */
export interface CreateSupplierInput {
  name: string;
  country: string;
  currency: string;
  address?: string;
  isActive?: boolean;
}

/** Matches `updateSupplierSchema` (a `.partial()` of the create shape, minus `contacts`). */
export type UpdateSupplierInput = Partial<CreateSupplierInput>;

/** Matches `supplierContactSchema`. */
export interface SupplierContactInput {
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
}

export const suppliersApi = {
  list: (params: SupplierListParams) =>
    apiClient.getPaginated<SupplierListItem>('/suppliers', {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      country: params.country,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }),
  get: (id: string) => apiClient.get<SupplierProfile>(`/suppliers/${id}`),
  create: (input: CreateSupplierInput) => apiClient.post<SupplierRecord>('/suppliers', input),
  update: (id: string, input: UpdateSupplierInput) =>
    apiClient.patch<SupplierRecord>(`/suppliers/${id}`, input),
  /** Soft delete — `DELETE /suppliers/:id`, returns 204. */
  deactivate: (id: string) => apiClient.delete(`/suppliers/${id}`),
  addContact: (supplierId: string, input: SupplierContactInput) =>
    apiClient.post<SupplierContact>(`/suppliers/${supplierId}/contacts`, input),
  removeContact: (supplierId: string, contactId: string) =>
    apiClient.delete(`/suppliers/${supplierId}/contacts/${contactId}`),
};
