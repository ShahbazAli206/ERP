import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

/**
 * Typed API layer for the Settings module — see
 * `apps/api/src/modules/settings/*.routes.ts` / `*.dto.ts` for the exact
 * backend shapes these mirror. Six sub-resources, all under `/settings/*`:
 * company (singleton), exchange rates (CRUD), generic key/value system
 * settings (get/set by key), users (read-only), roles (read-only), and
 * system logs (read-only, paginated).
 */

// ── Company settings (singleton) ─────────────────────────────────────────────

export interface CompanySettings {
  id: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  /** 3-letter ISO currency code, e.g. "PKR" — this doubles as the "Currency" section of the spec. */
  baseCurrency: string;
  logoUrl: string | null;
  updatedAt: string;
}

export interface CompanySettingsInput {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  baseCurrency?: string;
  logoUrl?: string;
}

export const companySettingsApi = {
  get: () => apiClient.get<CompanySettings>('/settings/company'),
  update: (input: CompanySettingsInput) => apiClient.put<CompanySettings>('/settings/company', input),
};

// ── Exchange rates ───────────────────────────────────────────────────────────

export interface ExchangeRate {
  id: string;
  currencyCode: string;
  rateToBase: number;
  updatedAt: string;
}

export interface CreateExchangeRateInput {
  currencyCode: string;
  rateToBase: number;
}

export interface UpdateExchangeRateInput {
  rateToBase: number;
}

export const exchangeRatesApi = {
  /** Not paginated server-side — the API returns the full list, always. */
  list: () => apiClient.get<ExchangeRate[]>('/settings/exchange-rates'),
  create: (input: CreateExchangeRateInput) => apiClient.post<ExchangeRate>('/settings/exchange-rates', input),
  update: (currencyCode: string, input: UpdateExchangeRateInput) =>
    apiClient.put<ExchangeRate>(`/settings/exchange-rates/${currencyCode}`, input),
  remove: (currencyCode: string) => apiClient.delete(`/settings/exchange-rates/${currencyCode}`),
};

// ── Generic system settings (key/value store) ────────────────────────────────

export interface SystemSetting {
  key: string;
  value: string;
}

/**
 * There is no dedicated Tax/Email/Notification/Backup table — those four
 * spec sections are all backed by this one generic key/value endpoint
 * (`GET/PUT /settings/system/:key`, value always a string). Each section
 * JSON-encodes a small object into `value` and decodes it back; see
 * `system-settings-view.tsx` for the exact shape stored per key and
 * `SYSTEM_SETTING_KEYS` below for the key names.
 */
export const SYSTEM_SETTING_KEYS = {
  tax: 'settings.tax',
  email: 'settings.email',
  notifications: 'settings.notifications',
  backup: 'settings.backup',
} as const;

export const systemSettingsApi = {
  get: (key: string) => apiClient.get<SystemSetting>(`/settings/system/${key}`),
  set: (key: string, value: string) => apiClient.put<SystemSetting>(`/settings/system/${key}`, { value }),
};

// ── Users (read-only) ─────────────────────────────────────────────────────────

export interface SettingsUserListItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  role: { name: string };
}

export type SettingsUserListParams = ListQueryParams;

export const settingsUsersApi = {
  list: (params: SettingsUserListParams) => apiClient.getPaginated<SettingsUserListItem>('/settings/users', { ...params }),
};

// ── Roles & permissions (read-only) ───────────────────────────────────────────

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export const settingsRolesApi = {
  list: () => apiClient.get<RoleWithPermissions[]>('/settings/roles'),
};

// ── System logs (read-only, audit trail) ──────────────────────────────────────

export interface SystemLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: string;
}

export type SystemLogListParams = ListQueryParams;

export const systemLogsApi = {
  list: (params: SystemLogListParams) => apiClient.getPaginated<SystemLog>('/settings/system-logs', { ...params }),
};
