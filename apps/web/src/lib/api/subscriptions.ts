import { api } from '../api';
import type { FinanceDateRangeParams, ListData } from './finance-common';

export interface SubscriptionListParams extends FinanceDateRangeParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  partnerId?: string;
  status?: string;
  type?: string;
  search?: string;
}

export interface Subscription {
  id: string;
  code: string;
  projectId: string;
  type: string;
  amount: string;
  billingDay: number;
  taxStatus: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  project: { id: string; code: string; name: string };
  company?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  partner?: { id: string; name: string } | null;
  invoices: Array<{ id: string; code: string; status: string; amount: string }>;
  coverage?: SubscriptionCoverageSummary;
}

export interface UpdateSubscriptionPayload {
  type?: string;
  amount?: number;
  billingDay?: number;
  taxStatus?: string;
  startDate?: string;
  endDate?: string;
  partnerId?: string | null;
}

export interface SubscriptionCoverageSummary {
  firstCoveredMonth: number | null;
  activeMonthCount: number;
  annualizedAmount: number;
}

/** Query params for `subscriptionsApi.getStats` (optional partner drill-down parity with list). */
export interface SubscriptionStatsQueryParams extends FinanceDateRangeParams {
  partnerId?: string;
}

export interface SubscriptionStats {
  total: number;
  byStatus: Array<{
    status: string;
    _count: number;
    _sum: { amount: number | null };
  }>;
  byType: Array<{
    type: string;
    _count: number;
    _sum: { amount: number | null };
  }>;
  activeSubscriptions: number;
  monthlyRevenue: number | null;
}

export const subscriptionsApi = {
  async getAll(params?: SubscriptionListParams): Promise<ListData<Subscription>> {
    const resp = await api.get<ListData<Subscription>>('/api/finance/subscriptions', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Subscription> {
    const resp = await api.get<Subscription>(`/api/finance/subscriptions/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Subscription> {
    const resp = await api.post<Subscription>('/api/finance/subscriptions', data);
    return resp.data;
  },
  async update(id: string, data: UpdateSubscriptionPayload): Promise<Subscription> {
    const resp = await api.put<Subscription>(`/api/finance/subscriptions/${id}`, data);
    return resp.data;
  },
  async updateStatus(id: string, status: string): Promise<Subscription> {
    const resp = await api.patch<Subscription>(`/api/finance/subscriptions/${id}/status`, {
      status,
    });
    return resp.data;
  },
  async getStats(params?: SubscriptionStatsQueryParams): Promise<SubscriptionStats> {
    const resp = await api.get<SubscriptionStats>('/api/finance/subscriptions/stats', { params });
    return resp.data;
  },
};
