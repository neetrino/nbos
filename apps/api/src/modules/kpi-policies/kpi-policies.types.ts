import type { KpiGateRules } from '../payroll-runs/kpi-gate-rules.types';

export interface CreateKpiPolicyBody {
  name: string;
  gateRules: KpiGateRules;
  scope?: string;
  notes?: string;
}

export interface UpdateKpiPolicyBody {
  name?: string;
  gateRules?: KpiGateRules;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  scope?: string | null;
  notes?: string | null;
}

export interface KpiPolicyDto {
  id: string;
  name: string;
  templateCode: string;
  gateRules: KpiGateRules;
  status: string;
  scope: string | null;
  notes: string | null;
  linkedProfileCount: number;
  createdAt: string;
  updatedAt: string;
}
