import { api } from '../api';

export interface Credential {
  id: string;
  projectId: string | null;
  category: string;
  provider: string | null;
  name: string;
  url: string | null;
  login: string | null;
  password: string | null;
  apiKey: string | null;
  envData: string | null;
  accessLevel: string;
  allowedEmployees: string[];
  createdAt: string;
  project?: { id: string; code: string; name: string } | null;
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const credentialsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<Credential>> {
    const resp = await api.get<ListData<Credential>>('/api/credentials', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Credential> {
    const resp = await api.get<Credential>(`/api/credentials/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Credential> {
    const resp = await api.post<Credential>('/api/credentials', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Credential> {
    const resp = await api.put<Credential>(`/api/credentials/${id}`, data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/credentials/${id}`);
  },
};
