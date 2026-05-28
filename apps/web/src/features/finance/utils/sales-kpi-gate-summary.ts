/** Read-only mirror of API `computeSalesKpiPayoutFactor` for month-sheet copy. */
export function salesKpiPayoutScaleLabel(plan: number, actual: number): string {
  if (plan <= 0) {
    return '100% (KPI plan not set)';
  }
  const ratio = actual / plan;
  if (ratio >= 0.7) {
    return '100%';
  }
  if (ratio >= 0.5) {
    return '50%';
  }
  return '0%';
}

export function buildSalesKpiGateSummary(
  planRaw: string | null,
  actualRaw: string | null,
): string | null {
  if (planRaw == null && actualRaw == null) {
    return null;
  }
  const plan = planRaw != null ? Number.parseFloat(planRaw) : Number.NaN;
  const actual = actualRaw != null ? Number.parseFloat(actualRaw) : Number.NaN;
  const hasPlan = Number.isFinite(plan);
  const hasActual = Number.isFinite(actual);
  if (!hasPlan && !hasActual) {
    return null;
  }
  if (!hasPlan || !hasActual || plan < 0 || actual < 0) {
    return 'Sales KPI plan/actual are incomplete in the synced snapshot. Included Sales bonuses scale at attach per KPI policy.';
  }
  const pct = plan > 0 ? Math.round((actual / plan) * 100) : 0;
  const scale = salesKpiPayoutScaleLabel(plan, actual);
  return `Sales KPI gate: actual ${pct}% of plan → ${scale} payout scale for included sales bonuses at attach.`;
}
