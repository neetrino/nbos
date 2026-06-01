import { Decimal } from '@nbos/database';

import type { EmployeeSalesKpiDetailDto } from './salary-line-month-detail.types';

function money(value: Decimal): string {
  return value.toFixed(2);
}

type KpiResultSnapshot = {
  planAmount: Decimal | null;
  actualAmount: Decimal | null;
  attainmentPct: Decimal | null;
  payoutFactor: Decimal;
};

/** Builds month-sheet KPI copy from `KpiResult` read model (not legacy payroll KPI fields). */
export function buildEmployeeSalesKpiDetailFromResult(params: {
  kpiPolicyId: string | null;
  result: KpiResultSnapshot | null;
}): EmployeeSalesKpiDetailDto {
  if (params.kpiPolicyId == null) {
    return {
      planAmount: null,
      actualAmount: null,
      attainmentPct: null,
      payoutFactor: null,
      source: 'NO_KPI_POLICY',
      effectivePayoutScaleLabel: '100% (no KPI policy)',
    };
  }

  if (params.result == null) {
    return {
      planAmount: null,
      actualAmount: null,
      attainmentPct: null,
      payoutFactor: null,
      source: 'NOT_SYNCED',
      effectivePayoutScaleLabel: null,
    };
  }

  const plan = params.result.planAmount;
  const actual = params.result.actualAmount;
  let scaleLabel: string | null = null;
  if (plan != null && actual != null && plan.gt(0)) {
    const pct = params.result.payoutFactor.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    scaleLabel = `${pct.toString()}% payout at attach`;
  } else if (params.result.payoutFactor.gte(1)) {
    scaleLabel = '100% payout at attach';
  }

  return {
    planAmount: plan != null ? money(plan) : null,
    actualAmount: actual != null ? money(actual) : null,
    attainmentPct: params.result.attainmentPct != null ? money(params.result.attainmentPct) : null,
    payoutFactor: params.result.payoutFactor.toFixed(4),
    source: 'KPI_RESULT',
    effectivePayoutScaleLabel: scaleLabel,
  };
}
