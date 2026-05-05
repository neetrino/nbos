import { api } from '../api';
import type { ListData } from './finance-common';

/** Resolved contact when `partner.contactId` points to a row in `contacts`. */
export interface PartnerContactSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Partner {
  id: string;
  name: string;
  /** Partner tier (Prisma `Partner.type`): REGULAR | PREMIUM. */
  level: string;
  direction: string;
  defaultPercent: string;
  status: string;
  contactId: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: PartnerContactSummary | null;
  _count?: { orders: number; subscriptions: number };
}

export interface PartnerStats {
  total: number;
  totalSubscriptions: number;
  avgPayoutPercent: number;
}

export type PartnerCommissionDealType = 'PRODUCT' | 'EXTENSION' | 'MAINTENANCE' | 'OUTSOURCE';

export interface PartnerCommissionPolicyRow {
  dealType: PartnerCommissionDealType;
  /** Null → use `fallbackPercent` (partner default). */
  percent: string | null;
}

export interface PartnerCommissionPolicy {
  partnerId: string;
  fallbackPercent: string;
  rows: PartnerCommissionPolicyRow[];
}

export interface PutPartnerCommissionPolicyBody {
  rows: Array<{ dealType: PartnerCommissionDealType; percent: number | null }>;
}

export interface PartnerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  level?: string;
  /** @deprecated Prefer `level`. */
  type?: string;
  direction?: string;
}

export interface CreatePartnerPayload {
  name: string;
  level?: string;
  /** @deprecated Prefer `level`. */
  type?: string;
  direction?: string;
  defaultPercent?: number;
  status?: string;
  contactId?: string;
}

export interface UpdatePartnerPayload {
  name?: string;
  level?: string;
  /** @deprecated Prefer `level`. */
  type?: string;
  direction?: string;
  defaultPercent?: number;
  status?: string;
  contactId?: string | null;
}

export const partnersApi = {
  async getAll(params?: PartnerListParams): Promise<ListData<Partner>> {
    const resp = await api.get<ListData<Partner>>('/api/partners', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Partner> {
    const resp = await api.get<Partner>(`/api/partners/${id}`);
    return resp.data;
  },
  async create(data: CreatePartnerPayload): Promise<Partner> {
    const resp = await api.post<Partner>('/api/partners', data);
    return resp.data;
  },
  async update(id: string, data: UpdatePartnerPayload): Promise<Partner> {
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

  async getCommissionPolicy(partnerId: string): Promise<PartnerCommissionPolicy> {
    const resp = await api.get<PartnerCommissionPolicy>(
      `/api/partners/${partnerId}/commission-policy`,
    );
    return resp.data;
  },

  async putCommissionPolicy(
    partnerId: string,
    body: PutPartnerCommissionPolicyBody,
  ): Promise<PartnerCommissionPolicy> {
    const resp = await api.put<PartnerCommissionPolicy>(
      `/api/partners/${partnerId}/commission-policy`,
      body,
    );
    return resp.data;
  },
};
