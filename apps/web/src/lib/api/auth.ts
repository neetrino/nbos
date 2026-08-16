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

export const authApi = {
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
