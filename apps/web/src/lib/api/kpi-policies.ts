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
  list(): Promise<{ items: KpiPolicyRow[] }> {
    return api.get<{ items: KpiPolicyRow[] }>('/api/kpi-policies');
  },

  getById(id: string): Promise<KpiPolicyRow> {
    return api.get<KpiPolicyRow>(`/api/kpi-policies/${id}`);
  },

  create(payload: CreateKpiPolicyPayload): Promise<KpiPolicyRow> {
    return api.post<KpiPolicyRow>('/api/kpi-policies', payload);
  },

  update(id: string, payload: UpdateKpiPolicyPayload): Promise<KpiPolicyRow> {
    return api.patch<KpiPolicyRow>(`/api/kpi-policies/${id}`, payload);
  },
};
