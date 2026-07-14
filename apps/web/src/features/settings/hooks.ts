'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  companySettingsApi,
  exchangeRatesApi,
  settingsRolesApi,
  settingsUsersApi,
  systemLogsApi,
  systemSettingsApi,
  type CompanySettingsInput,
  type CreateExchangeRateInput,
  type SettingsUserListParams,
  type SystemLogListParams,
  type UpdateExchangeRateInput,
} from './api';

// ── Company settings ─────────────────────────────────────────────────────────

export function useCompanySettings() {
  return useQuery({ queryKey: ['settings', 'company'], queryFn: companySettingsApi.get });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompanySettingsInput) => companySettingsApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'company'] }),
  });
}

// ── Exchange rates ───────────────────────────────────────────────────────────

export function useExchangeRates() {
  return useQuery({ queryKey: ['settings', 'exchange-rates'], queryFn: exchangeRatesApi.list });
}

export function useCreateExchangeRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExchangeRateInput) => exchangeRatesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'exchange-rates'] }),
  });
}

export function useUpdateExchangeRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currencyCode, input }: { currencyCode: string; input: UpdateExchangeRateInput }) =>
      exchangeRatesApi.update(currencyCode, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'exchange-rates'] }),
  });
}

export function useDeleteExchangeRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currencyCode: string) => exchangeRatesApi.remove(currencyCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'exchange-rates'] }),
  });
}

// ── Generic system settings (key/value) ───────────────────────────────────────

/**
 * `GET /settings/system/:key` 404s until the key has been saved once (see
 * `systemSettings.service.ts`) — that's expected for a freshly-seeded demo,
 * not a real error, so `retry: false` avoids three retries on every
 * not-yet-configured key. Callers should check `error instanceof ApiError &&
 * error.status === 404` and fall back to that section's schema defaults
 * instead of showing an error banner (see `system-settings-view.tsx`).
 */
export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ['settings', 'system', key],
    queryFn: () => systemSettingsApi.get(key),
    retry: false,
  });
}

export function useSetSystemSetting(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => systemSettingsApi.set(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'system', key] }),
  });
}

// ── Users (read-only) ─────────────────────────────────────────────────────────

export function useSettingsUsers(params: SettingsUserListParams) {
  return useQuery({ queryKey: ['settings', 'users', 'list', params], queryFn: () => settingsUsersApi.list(params) });
}

// ── Roles & permissions (read-only) ───────────────────────────────────────────

export function useSettingsRoles() {
  return useQuery({ queryKey: ['settings', 'roles'], queryFn: settingsRolesApi.list });
}

// ── System logs (read-only) ───────────────────────────────────────────────────

export function useSystemLogs(params: SystemLogListParams) {
  return useQuery({ queryKey: ['settings', 'system-logs', 'list', params], queryFn: () => systemLogsApi.list(params) });
}
