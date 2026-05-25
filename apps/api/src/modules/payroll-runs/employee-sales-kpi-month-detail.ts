import { Decimal } from '@nbos/database';

import type { EmployeeSalesKpiDetailDto } from './salary-line-month-detail.types';
import { resolveEmployeeSalesKpi } from './resolve-employee-sales-kpi';

function money(value: Decimal): string {
  return value.toFixed(2);
}

export function buildEmployeeSalesKpiDetail(
  resolved: ReturnType<typeof resolveEmployeeSalesKpi>,
  factor: Decimal,
): EmployeeSalesKpiDetailDto {
  const plan = resolved.kpiSalesPlanAmount;
  const actual = resolved.kpiSalesActualAmount;
  let scaleLabel: string | null = null;
  if (plan != null && actual != null && plan.gt(0)) {
    const pct = factor.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    scaleLabel = `${pct.toString()}% payout at attach`;
  }
  return {
    planAmount: plan != null ? money(plan) : null,
    actualAmount: actual != null ? money(actual) : null,
    source: resolved.source,
    effectivePayoutScaleLabel: scaleLabel,
  };
}
