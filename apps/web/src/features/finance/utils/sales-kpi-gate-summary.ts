import type { PayrollTranslator } from '@/features/finance/components/payroll/payroll-compensation-i18n';

export type SalesKpiPayoutScaleMessageKey =
  | 'compensation.kpi.scale.full'
  | 'compensation.kpi.scale.half'
  | 'compensation.kpi.scale.zero'
  | 'compensation.kpi.scale.planNotSet';

/** Read-only mirror of API `computeSalesKpiPayoutFactor` for month-sheet copy. */
export function salesKpiPayoutScaleMessageKey(
  plan: number,
  actual: number,
): SalesKpiPayoutScaleMessageKey {
  if (plan <= 0) {
    return 'compensation.kpi.scale.planNotSet';
  }
  const ratio = actual / plan;
  if (ratio >= 0.7) {
    return 'compensation.kpi.scale.full';
  }
  if (ratio >= 0.5) {
    return 'compensation.kpi.scale.half';
  }
  return 'compensation.kpi.scale.zero';
}

export function salesKpiPayoutScaleLabel(
  plan: number,
  actual: number,
  t: PayrollTranslator,
): string {
  return t(salesKpiPayoutScaleMessageKey(plan, actual));
}

export function buildSalesKpiGateSummary(
  planRaw: string | null,
  actualRaw: string | null,
  t: PayrollTranslator,
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
    return t('compensation.kpi.gateSummary.incomplete');
  }
  const pct = plan > 0 ? Math.round((actual / plan) * 100) : 0;
  const scale = salesKpiPayoutScaleLabel(plan, actual, t);
  return t('compensation.kpi.gateSummary.complete', { pct, scale });
}
