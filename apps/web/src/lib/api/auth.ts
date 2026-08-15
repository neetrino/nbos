import { api } from '../api';

export interface ChangePasswordResult {
  success: true;
  requiresReauth: true;
}

export const authApi = {
  changePassword: async (input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ChangePasswordResult> => {
    const { data } = await api.post<ChangePasswordResult>('/api/v1/auth/change-password', input);
    return data;
  },
};
