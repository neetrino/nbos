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

export const bonusPoliciesApi = {
  async list(): Promise<{ items: BonusPolicyRow[] }> {
    const resp = await api.get<{ items: BonusPolicyRow[] }>('/api/bonus-policies');
    return resp.data;
  },
};
