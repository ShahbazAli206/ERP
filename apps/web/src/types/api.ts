/**
 * Shared shapes for the API response envelope used by every endpoint under
 * `apps/api` (see `apps/api/src/shared/response.ts` / `middleware/errorHandler.ts`).
 *
 * Success:   { data: T, meta?: { pagination?: PaginationMeta } }
 * Error:     { error: { code, message, details? } }  (never reaches app code as
 *            JSON — src/lib/api-client.ts converts it into a thrown `ApiError`)
 */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Standard shape for paginated list results once unwrapped by the API client
 * (see `apiClient.getPaginated` in `src/lib/api-client.ts`). Every module's
 * list endpoint should be consumed through this shape so the shared
 * `DataTable` component (`src/components/shared/data-table.tsx`) can wire up
 * pagination generically.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Common query params accepted by list endpoints. Individual modules extend
 * this with their own filter/sort fields, e.g.:
 *
 *   interface SupplierListParams extends ListQueryParams {
 *     search?: string;
 *     isActive?: boolean;
 *     sortBy?: 'name' | 'createdAt';
 *     sortOrder?: 'asc' | 'desc';
 *   }
 */
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
}
