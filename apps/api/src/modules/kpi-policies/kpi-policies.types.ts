import type { KpiGateRules } from '../payroll-runs/kpi-gate-rules.types';
import type { KpiScorecardMetric } from './kpi-scorecard-metrics.types';

export interface CreateKpiPolicyBody {
  name: string;
  gateRules: KpiGateRules;
  scorecardMetrics?: KpiScorecardMetric[];
  /** Base salary × multiplier = max bonuses per month (default 2). */
  bonusCapBaseSalaryMultiplier?: number;
  scope?: string;
  notes?: string;
}

export interface UpdateKpiPolicyBody {
  name?: string;
  gateRules?: KpiGateRules;
  scorecardMetrics?: KpiScorecardMetric[];
  bonusCapBaseSalaryMultiplier?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  scope?: string | null;
  notes?: string | null;
}

export interface KpiPolicyDto {
  id: string;
  name: string;
  templateCode: string;
  gateRules: KpiGateRules;
  scorecardMetrics: KpiScorecardMetric[];
  bonusCapBaseSalaryMultiplier: string;
  status: string;
  scope: string | null;
  notes: string | null;
  linkedProfileCount: number;
  createdAt: string;
  updatedAt: string;
}
