import { api } from '../api';

export interface SystemListOption {
  id: string;
  listKey: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const systemListsApi = {
  async getListKeys(): Promise<{ listKey: string }[]> {
    const resp = await api.get<{ listKey: string }[]>('/api/system-lists/keys');
    return resp.data;
  },

  async getOptionsByKey(
    listKey: string,
    params?: { includeInactive?: boolean },
  ): Promise<SystemListOption[]> {
    const resp = await api.get<SystemListOption[]>(
      `/api/system-lists/options/${encodeURIComponent(listKey)}`,
      { params: params?.includeInactive ? { includeInactive: 'true' } : undefined },
    );
    return resp.data;
  },

  async getAllOptions(params?: {
    listKey?: string;
    includeInactive?: boolean;
  }): Promise<SystemListOption[]> {
    const resp = await api.get<SystemListOption[]>('/api/system-lists', {
      params: {
        ...(params?.listKey && { listKey: params.listKey }),
        ...(params?.includeInactive && { includeInactive: 'true' }),
      },
    });
    return resp.data;
  },

  async getById(id: string): Promise<SystemListOption> {
    const resp = await api.get<SystemListOption>(`/api/system-lists/${id}`);
    return resp.data;
  },

  async create(data: {
    listKey: string;
    code: string;
    label: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<SystemListOption> {
    const resp = await api.post<SystemListOption>('/api/system-lists', data);
    return resp.data;
  },

  async update(
    id: string,
    data: { code?: string; label?: string; sortOrder?: number; isActive?: boolean },
  ): Promise<SystemListOption> {
    const resp = await api.patch<SystemListOption>(`/api/system-lists/${id}`, data);
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/system-lists/${id}`);
  },
};
