import { api } from '../api';

export interface Partner {
  id: string;
  name: string;
  type: string;
  direction: string;
  defaultPercent: string;
  status: string;
  contactId: string | null;
  createdAt: string;
  _count?: { orders: number; subscriptions: number };
}

export interface PartnerStats {
  total: number;
  totalSubscriptions: number;
  avgPayoutPercent: number;
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const partnersApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<Partner>> {
    const resp = await api.get<ListData<Partner>>('/api/partners', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Partner> {
    const resp = await api.get<Partner>(`/api/partners/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Partner> {
    const resp = await api.post<Partner>('/api/partners', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Partner> {
    const resp = await api.put<Partner>(`/api/partners/${id}`, data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/partners/${id}`);
  },
  async getStats(): Promise<PartnerStats> {
    const resp = await api.get<PartnerStats>('/api/partners/stats');
    return resp.data;
  },
};
