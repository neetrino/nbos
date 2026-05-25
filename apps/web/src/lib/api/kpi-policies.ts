import { api } from '../api';

export type KpiGateBand = {
  minAttainmentPct: number;
  payoutFactor: number;
};

export type KpiGateRules = {
  bands: KpiGateBand[];
};

export type KpiPolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type KpiScorecardMetric = {
  code: string;
  label: string;
  period: 'WEEK' | 'MONTH' | 'QUARTER' | 'SPRINT';
  description?: string;
  payrollField?: 'kpiSalesPlanAmount' | 'kpiSalesActualAmount';
};

export interface KpiPolicyRow {
  id: string;
  name: string;
  templateCode: string;
  gateRules: KpiGateRules;
  scorecardMetrics: KpiScorecardMetric[];
  bonusCapBaseSalaryMultiplier: string;
  status: KpiPolicyStatus;
  scope: string | null;
  notes: string | null;
  linkedProfileCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKpiPolicyPayload {
  name: string;
  gateRules: KpiGateRules;
  scorecardMetrics?: KpiScorecardMetric[];
  bonusCapBaseSalaryMultiplier?: number;
  scope?: string;
  notes?: string;
}

export interface UpdateKpiPolicyPayload {
  name?: string;
  gateRules?: KpiGateRules;
  bonusCapBaseSalaryMultiplier?: number;
  status?: KpiPolicyStatus;
  scope?: string | null;
  notes?: string | null;
}

export const kpiPoliciesApi = {
  async list(): Promise<{ items: KpiPolicyRow[] }> {
    const { data } = await api.get<{ items: KpiPolicyRow[] }>('/api/kpi-policies');
    return data;
  },

  async getById(id: string): Promise<KpiPolicyRow> {
    const { data } = await api.get<KpiPolicyRow>(`/api/kpi-policies/${id}`);
    return data;
  },

  async create(payload: CreateKpiPolicyPayload): Promise<KpiPolicyRow> {
    const { data } = await api.post<KpiPolicyRow>('/api/kpi-policies', payload);
    return data;
  },

  async update(id: string, payload: UpdateKpiPolicyPayload): Promise<KpiPolicyRow> {
    const { data } = await api.patch<KpiPolicyRow>(`/api/kpi-policies/${id}`, payload);
    return data;
  },
};
