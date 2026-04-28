import { api } from '../api';

export interface MarketingAccount {
  id: string;
  channel: string;
  name: string;
  identifier: string | null;
  phone: string | null;
  status: string;
  financeExpensePlanId: string | null;
  defaultCost: number | null;
  ownerId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingActivity {
  id: string;
  title: string;
  channel: string;
  type: string;
  status: string;
  accountId: string | null;
  ownerId: string | null;
  description: string | null;
  budget: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  expectedPayAt: string | null;
  expenseCardId: string | null;
  expensePlanId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  account?: { id: string; name: string; channel: string } | null;
}

export interface MarketingDashboardSummary {
  totals: {
    accounts: number;
    activities: number;
    launchedActivities: number;
    activitiesWithFinanceExpense: number;
    missingFinanceLinks: number;
    attributedDeals: number;
    wonAttributedDeals: number;
  };
  money: {
    plannedSpend: number;
    paidRevenue: number;
  };
  warnings: Array<{
    code: string;
    message: string;
    count: number;
  }>;
}

export interface LaunchMarketingActivityPayload {
  startDate: string;
  endDate?: string | null;
  budget?: number | null;
  expectedPayAt?: string | null;
  accountId?: string | null;
  noExpenseReason?: string | null;
}

export interface AttributionOption {
  id: string;
  label: string;
  type: 'ACCOUNT' | 'ACTIVITY' | 'ORGANIC';
  channel: string;
  subtitle?: string;
}

interface MarketingQueryParams {
  channel?: string;
  status?: string;
  accountId?: string;
  search?: string;
}

export const marketingApi = {
  async getDashboardSummary(): Promise<MarketingDashboardSummary> {
    const resp = await api.get<MarketingDashboardSummary>('/api/marketing/dashboard');
    return resp.data;
  },

  async getAccounts(params?: MarketingQueryParams): Promise<MarketingAccount[]> {
    const resp = await api.get<MarketingAccount[]>('/api/marketing/accounts', { params });
    return resp.data;
  },

  async createAccount(data: Partial<MarketingAccount>): Promise<MarketingAccount> {
    const resp = await api.post<MarketingAccount>('/api/marketing/accounts', data);
    return resp.data;
  },

  async updateAccount(id: string, data: Partial<MarketingAccount>): Promise<MarketingAccount> {
    const resp = await api.patch<MarketingAccount>(`/api/marketing/accounts/${id}`, data);
    return resp.data;
  },

  async getActivities(params?: MarketingQueryParams): Promise<MarketingActivity[]> {
    const resp = await api.get<MarketingActivity[]>('/api/marketing/activities', { params });
    return resp.data;
  },

  async createActivity(data: Partial<MarketingActivity>): Promise<MarketingActivity> {
    const resp = await api.post<MarketingActivity>('/api/marketing/activities', data);
    return resp.data;
  },

  async launchActivity(
    id: string,
    data: LaunchMarketingActivityPayload,
  ): Promise<MarketingActivity> {
    const resp = await api.post<MarketingActivity>(`/api/marketing/activities/${id}/launch`, data);
    return resp.data;
  },

  async getAttributionOptions(where: string): Promise<AttributionOption[]> {
    const resp = await api.get<AttributionOption[]>('/api/marketing/attribution-options', {
      params: { where },
    });
    return resp.data;
  },

  async getAttributionReview() {
    const resp = await api.get('/api/marketing/attribution-review');
    return resp.data;
  },
};
