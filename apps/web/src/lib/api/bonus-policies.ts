import { api } from './client';

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
    const resp = await api.get<{ items: BonusPolicyRow[] }>('/api/bonus-policies');
    return resp.data;
  },

  getById(id: string): Promise<BonusPolicyRow> {
    return api.get<BonusPolicyRow>(`/api/bonus-policies/${id}`);
  },

  create(payload: CreateBonusPolicyPayload): Promise<BonusPolicyRow> {
    return api.post<BonusPolicyRow>('/api/bonus-policies', payload);
  },

  update(id: string, payload: UpdateBonusPolicyPayload): Promise<BonusPolicyRow> {
    return api.patch<BonusPolicyRow>(`/api/bonus-policies/${id}`, payload);
  },
};
