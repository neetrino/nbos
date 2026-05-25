/** Policy template implemented in code — row stores parameters only. */
export const KPI_POLICY_TEMPLATE_GATE_PAYOUT = 'KPI_GATE_PAYOUT_MULTIPLIER' as const;

export type KpiGateBand = {
  /** Inclusive lower bound of plan attainment % (actual/plan × 100). */
  minAttainmentPct: number;
  /** Multiplier applied to release amount at payroll attach (0–1). */
  payoutFactor: number;
};

export type KpiGateRules = {
  bands: KpiGateBand[];
};
