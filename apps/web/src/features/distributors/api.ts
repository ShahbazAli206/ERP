import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

/** Mirrors `DistributorListItemDto` in `apps/api/src/modules/distributors/distributors.dto.ts`. */
export interface DistributorListItem {
  id: string;
  name: string;
  region: string;
  creditLimit: number;
  pricingGroupName: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Mirrors `SalesHistoryItemDto`. */
export interface DistributorSalesHistoryItem {
  salesOrderId: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  totalAmount: number;
}

/** Mirrors `PaymentHistoryItemDto`. */
export interface DistributorPaymentHistoryItem {
  id: string;
  amount: number;
  method: string;
  currency: string;
  paymentDate: string;
  reference: string | null;
}

/** Mirrors `DistributorProfileDto` — the shape returned by `GET /distributors/:id`. */
export interface DistributorProfile {
  id: string;
  name: string;
  region: string;
  creditLimit: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  isActive: boolean;
  pricingGroup: { id: string; name: string; discountPercent: number } | null;
  outstandingBalance: number;
  salesHistory: DistributorSalesHistoryItem[];
  paymentHistory: DistributorPaymentHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape returned by create/update — the repository's raw record (includes
 * the full `pricingGroup` relation, but none of the profile's derived fields
 * like `outstandingBalance`/`salesHistory`/`paymentHistory`), distinct from
 * `DistributorProfile`. Mirrors the `SupplierRecord`/`SupplierProfile` split
 * in `features/suppliers/api.ts`.
 */
export interface DistributorRecord {
  id: string;
  name: string;
  region: string;
  creditLimit: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  isActive: boolean;
  pricingGroup: { id: string; name: string; discountPercent: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DistributorListParams extends ListQueryParams {
  search?: string;
  region?: string;
  pricingGroupId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'region';
  sortOrder?: 'asc' | 'desc';
}

/** Matches `createDistributorSchema` in `distributors.validation.ts`. */
export interface CreateDistributorInput {
  name: string;
  region: string;
  creditLimit: number;
  pricingGroupId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive?: boolean;
}

/** Matches `updateDistributorSchema` (a `.partial()` of the create shape). */
export type UpdateDistributorInput = Partial<CreateDistributorInput>;

export const distributorsApi = {
  list: (params: DistributorListParams) =>
    apiClient.getPaginated<DistributorListItem>('/distributors', {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      region: params.region,
      pricingGroupId: params.pricingGroupId,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }),
  get: (id: string) => apiClient.get<DistributorProfile>(`/distributors/${id}`),
  create: (input: CreateDistributorInput) => apiClient.post<DistributorRecord>('/distributors', input),
  update: (id: string, input: UpdateDistributorInput) =>
    apiClient.patch<DistributorRecord>(`/distributors/${id}`, input),
  /** Soft delete (deactivate) — `DELETE /distributors/:id`, returns 204. */
  deactivate: (id: string) => apiClient.delete(`/distributors/${id}`),
};
