import { BadRequestException } from '@nestjs/common';
import { Decimal, type BonusTypeEnum } from '@nbos/database';

import { DEFAULT_KPI_GATE_RULES } from './default-kpi-gate-rules';
import { computeKpiGatePayoutFactor } from './kpi-gate-payout';
import type { KpiGateRules } from './kpi-gate-rules.types';

export type PayrollRunKpiSnapshot = {
  kpiSalesPlanAmount: Decimal | null;
  kpiSalesActualAmount: Decimal | null;
};

export function computeSalesKpiPayoutFactor(plan: Decimal, actual: Decimal): Decimal {
  return computeKpiGatePayoutFactor(plan, actual, DEFAULT_KPI_GATE_RULES);
}

export function resolveSalesKpiPayoutFactorFromRun(
  run: PayrollRunKpiSnapshot,
  gateRules: KpiGateRules = DEFAULT_KPI_GATE_RULES,
): Decimal {
  const plan = run.kpiSalesPlanAmount != null ? new Decimal(run.kpiSalesPlanAmount) : null;
  const actual = run.kpiSalesActualAmount != null ? new Decimal(run.kpiSalesActualAmount) : null;
  if (plan == null || actual == null || plan.lte(0)) {
    return new Decimal(1);
  }
  return computeKpiGatePayoutFactor(plan, actual, gateRules);
}

/**
 * When attaching SALES releases, both KPI inputs must be present if either is set, and plan must be positive.
 */
export function assertSalesKpiInputsComplete(
  run: PayrollRunKpiSnapshot,
  hasSalesRelease: boolean,
): void {
  if (!hasSalesRelease) {
    return;
  }
  const plan = run.kpiSalesPlanAmount != null ? new Decimal(run.kpiSalesPlanAmount) : null;
  const actual = run.kpiSalesActualAmount != null ? new Decimal(run.kpiSalesActualAmount) : null;
  const anySet = plan != null || actual != null;
  if (!anySet) {
    return;
  }
  if (plan == null || actual == null) {
    throw new BadRequestException(
      'Sales KPI requires both kpiSalesPlanAmount and kpiSalesActualAmount on the payroll run (or clear both to skip).',
    );
  }
  if (plan.lte(0)) {
    throw new BadRequestException(
      'kpiSalesPlanAmount must be positive when sales KPI fields are set on the payroll run.',
    );
  }
}

export function computePayrollIncludedBonusAmount(params: {
  releaseAmount: Decimal;
  bonusType: BonusTypeEnum;
  kpiFactor: Decimal;
}): Decimal {
  if (params.bonusType !== 'SALES') {
    return params.releaseAmount;
  }
  return params.releaseAmount.mul(params.kpiFactor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
