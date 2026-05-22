import type { KpiGateRules } from './kpi-gate-rules.types';

/** Matches legacy hardcoded sales gate until employee has an active KPI policy. */
export const DEFAULT_KPI_GATE_RULES: KpiGateRules = {
  bands: [
    { minAttainmentPct: 70, payoutFactor: 1 },
    { minAttainmentPct: 50, payoutFactor: 0.5 },
    { minAttainmentPct: 0, payoutFactor: 0 },
  ],
};
