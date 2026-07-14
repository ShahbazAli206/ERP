import { apiClient } from '@/lib/api-client';
import type { LoginFormValues, ForgotPasswordFormValues } from './schemas';

/** Mirrors `UserProfileDto` in `apps/api/src/modules/auth/auth.dto.ts`. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  /** `"<module>:<action>"` strings — the sole source of truth for nav visibility / action gating. */
  permissions: string[];
  isActive: boolean;
  avatarUrl: string | null;
  lastLoginAt: string | null;
}

/** Mirrors `LoginResponseDto`. */
export interface LoginResponse {
  token: string;
  expiresIn: string;
  user: AuthUser;
}

export const authApi = {
  login: (values: LoginFormValues) => apiClient.post<LoginResponse>('/auth/login', values),
  logout: () => apiClient.post<{ message: string }>('/auth/logout'),
  me: () => apiClient.get<AuthUser>('/auth/me'),
  forgotPassword: (values: ForgotPasswordFormValues) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', values),
};
