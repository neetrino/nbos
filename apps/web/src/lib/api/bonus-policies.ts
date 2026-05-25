import { api } from '../api';

export type BonusPolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface BonusPolicyRow {
  id: string;
  name: string;
  templateCode: string;
  status: BonusPolicyStatus;
  scope: string | null;
  notes: string | null;
  linkedProfileCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBonusPolicyPayload {
  name: string;
  templateCode: string;
  scope?: string;
  notes?: string;
}

export interface UpdateBonusPolicyPayload {
  name?: string;
  status?: BonusPolicyStatus;
  scope?: string | null;
  notes?: string | null;
}

export const bonusPoliciesApi = {
  async list(): Promise<{ items: BonusPolicyRow[] }> {
    const { data } = await api.get<{ items: BonusPolicyRow[] }>('/api/bonus-policies');
    return data;
  },

  async getById(id: string): Promise<BonusPolicyRow> {
    const { data } = await api.get<BonusPolicyRow>(`/api/bonus-policies/${id}`);
    return data;
  },

  async create(payload: CreateBonusPolicyPayload): Promise<BonusPolicyRow> {
    const { data } = await api.post<BonusPolicyRow>('/api/bonus-policies', payload);
    return data;
  },

  async update(id: string, payload: UpdateBonusPolicyPayload): Promise<BonusPolicyRow> {
    const { data } = await api.patch<BonusPolicyRow>(`/api/bonus-policies/${id}`, payload);
    return data;
  },
};
