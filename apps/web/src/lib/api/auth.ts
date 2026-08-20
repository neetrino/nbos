import { api } from '../api';

export interface ChangePasswordResult {
  success: true;
  requiresReauth: true;
}

export interface ForgotPasswordResult {
  message: string;
}

export interface ResetPasswordInfo {
  email: string;
}

export type AuthSessionClientKind = 'web' | 'mobile_work' | 'mobile_messenger' | 'mobile_vault';

export interface AuthSessionRow {
  id: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  deviceLabel: string | null;
  clientKind: AuthSessionClientKind;
  current: boolean;
}

export const authApi = {
  listSessions: async (): Promise<AuthSessionRow[]> => {
    const { data } = await api.get<AuthSessionRow[]>('/api/v1/auth/sessions');
    return data;
  },

  revokeSession: async (sessionId: string): Promise<{ success: true }> => {
    const { data } = await api.delete<{ success: true }>(`/api/v1/auth/sessions/${sessionId}`);
    return data;
  },

  logoutOthers: async (): Promise<{ success: true; revoked: number }> => {
    const { data } = await api.post<{ success: true; revoked: number }>(
      '/api/v1/auth/logout-others',
    );
    return data;
  },

  changePassword: async (input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ChangePasswordResult> => {
    const { data } = await api.post<ChangePasswordResult>('/api/v1/auth/change-password', input);
    return data;
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResult> => {
    const { data } = await api.post<ForgotPasswordResult>('/api/v1/auth/forgot-password', {
      email,
    });
    return data;
  },

  getResetPasswordInfo: async (token: string): Promise<ResetPasswordInfo> => {
    const { data } = await api.get<ResetPasswordInfo>('/api/v1/auth/reset-password-info', {
      params: { token },
    });
    return data;
  },

  resetPassword: async (input: {
    token: string;
    newPassword: string;
  }): Promise<ChangePasswordResult> => {
    const { data } = await api.post<ChangePasswordResult>('/api/v1/auth/reset-password', input);
    return data;
  },
};
