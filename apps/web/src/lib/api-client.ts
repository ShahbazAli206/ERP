import { getSessionToken } from './session';
import type { ApiErrorEnvelope, ApiSuccessEnvelope, PaginatedResult } from '@/types/api';

/**
 * Typed fetch wrapper around the Express API. This is the ONE place that
 * knows about the `{ data }` / `{ error }` envelope, the base URL, and auth
 * header attachment — every module's `features/<module>/api.ts` should call
 * through `apiClient` rather than using `fetch` directly.
 *
 * ── Usage pattern for a new module (copy this per Phase 8 module) ───────
 *
 *   // src/features/suppliers/api.ts
 *   import { apiClient } from '@/lib/api-client';
 *   import type { PaginatedResult } from '@/types/api';
 *
 *   export interface Supplier { id: string; name: string; ... }
 *
 *   export interface SupplierListParams {
 *     page?: number;
 *     pageSize?: number;
 *     search?: string;
 *     isActive?: boolean;
 *   }
 *
 *   export const suppliersApi = {
 *     list: (params: SupplierListParams) =>
 *       apiClient.getPaginated<Supplier>('/suppliers', params),
 *     get: (id: string) => apiClient.get<Supplier>(`/suppliers/${id}`),
 *     create: (input: CreateSupplierInput) => apiClient.post<Supplier>('/suppliers', input),
 *     update: (id: string, input: UpdateSupplierInput) =>
 *       apiClient.patch<Supplier>(`/suppliers/${id}`, input),
 *     deactivate: (id: string) => apiClient.delete(`/suppliers/${id}`),
 *   };
 *
 * Then wrap each function in a React Query hook where it's used, e.g.:
 *
 *   // src/features/suppliers/hooks.ts
 *   export function useSuppliers(params: SupplierListParams) {
 *     return useQuery({
 *       queryKey: ['suppliers', 'list', params],
 *       queryFn: () => suppliersApi.list(params),
 *     });
 *   }
 *
 * For errors, catch `ApiError` (thrown by this module) to inspect
 * `.status` / `.code` / `.message` / `.details` — React Query surfaces it as
 * `error` on the query/mutation result, e.g.:
 *
 *   const mutation = useMutation({
 *     mutationFn: suppliersApi.create,
 *     onError: (error) => {
 *       if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') { ... }
 *     },
 *   });
 * ──────────────────────────────────────────────────────────────────────
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');

/** Thrown for every non-2xx response. Carries the backend's error envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True for auth-related failures where retrying the same request is pointless. */
  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

export type QueryParamValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryParamValue>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  params?: QueryParams;
  /** JSON-serializable body. Do not set together with `formData`. */
  body?: unknown;
  /** For file uploads — sent as-is with no Content-Type override (the browser sets the multipart boundary). */
  formData?: FormData;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function coreRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccessEnvelope<T>> {
  const { method = 'GET', params, body, formData, signal } = options;
  const token = getSessionToken();

  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (body !== undefined && !formData) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal,
    });
  } catch {
    // Network failure (API down, CORS, offline) — no response envelope to parse.
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.');
  }

  // 204 No Content (deletes) — nothing to parse.
  if (response.status === 204) {
    return { data: undefined as T };
  }

  const text = await response.text();
  const json = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    const envelope = json as ApiErrorEnvelope | undefined;
    throw new ApiError(
      response.status,
      envelope?.error?.code ?? 'UNKNOWN_ERROR',
      envelope?.error?.message ?? `Request failed with status ${response.status}`,
      envelope?.error?.details,
    );
  }

  return json as ApiSuccessEnvelope<T>;
}

export const apiClient = {
  /** GET a single resource / non-list endpoint. Returns the unwrapped `data`. */
  get<T>(path: string, params?: QueryParams, signal?: AbortSignal): Promise<T> {
    return coreRequest<T>(path, { method: 'GET', params, signal }).then((r) => r.data);
  },

  /**
   * GET a paginated list endpoint. Returns `{ data, pagination }` — pass
   * `page`/`pageSize` (and any module-specific filter/sort fields) via
   * `params`; the shared `DataTable` component consumes this shape
   * directly (see `src/components/shared/data-table.tsx`).
   */
  async getPaginated<T>(path: string, params?: QueryParams, signal?: AbortSignal): Promise<PaginatedResult<T>> {
    const envelope = await coreRequest<T[]>(path, { method: 'GET', params, signal });
    return {
      data: envelope.data,
      pagination: envelope.meta?.pagination ?? { page: 1, pageSize: envelope.data.length, total: envelope.data.length },
    };
  },

  post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return coreRequest<T>(path, { method: 'POST', body, signal }).then((r) => r.data);
  },

  patch<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return coreRequest<T>(path, { method: 'PATCH', body, signal }).then((r) => r.data);
  },

  put<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return coreRequest<T>(path, { method: 'PUT', body, signal }).then((r) => r.data);
  },

  async delete(path: string, signal?: AbortSignal): Promise<void> {
    await coreRequest<void>(path, { method: 'DELETE', signal });
  },

  /** Multipart upload (attachments, imports, etc). `fieldName` matches the multer field the route expects. */
  upload<T>(path: string, file: File, fieldName = 'file', extraFields?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) formData.append(key, value);
    }
    return coreRequest<T>(path, { method: 'POST', formData }).then((r) => r.data);
  },

  /**
   * Downloads a file response (Content-Disposition: attachment — e.g. Reports' PDF/Excel
   * export, Phase 9) and triggers a browser save. Bypasses `coreRequest`'s JSON envelope
   * parsing since the response body is a binary blob, not `{ data }`; still attaches the auth
   * header the same way (exports are behind the same permission as their JSON counterpart, so
   * a plain `<a href>` link wouldn't carry the token).
   */
  async download(path: string, params: QueryParams, fallbackFilename: string): Promise<void> {
    const token = getSessionToken();
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(buildUrl(path, params), { headers });
    if (!response.ok) {
      const text = await response.text();
      const envelope = text ? (JSON.parse(text) as ApiErrorEnvelope) : undefined;
      throw new ApiError(
        response.status,
        envelope?.error?.code ?? 'UNKNOWN_ERROR',
        envelope?.error?.message ?? `Download failed with status ${response.status}`,
      );
    }

    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? fallbackFilename;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
