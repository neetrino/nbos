import { BadRequestException } from '@nestjs/common';
import { Decimal, type BonusTypeEnum } from '@nbos/database';

/** NBOS `03-Bonus-Payroll-Logic.md`: full payout when plan execution ≥ this % */
export const SALES_KPI_FULL_PAYOUT_MIN_PLAN_PCT = new Decimal(70);

/** Half payout band lower bound (inclusive). */
export const SALES_KPI_HALF_PAYOUT_MIN_PLAN_PCT = new Decimal(50);

const ZERO = new Decimal(0);
const ONE = new Decimal(1);
const HALF = new Decimal(0.5);

/**
 * Seller KPI coefficient applied to **payout** (not accrual), from plan attainment ratio actual/plan.
 */
export function computeSalesKpiPayoutFactor(plan: Decimal, actual: Decimal): Decimal {
  if (plan.lte(0)) {
    return ONE;
  }
  const pct = actual.div(plan).mul(100);
  if (pct.gte(SALES_KPI_FULL_PAYOUT_MIN_PLAN_PCT)) {
    return ONE;
  }
  if (pct.gte(SALES_KPI_HALF_PAYOUT_MIN_PLAN_PCT)) {
    return HALF;
  }
  return ZERO;
}

export type PayrollRunKpiSnapshot = {
  kpiSalesPlanAmount: Decimal | null;
  kpiSalesActualAmount: Decimal | null;
};

export function resolveSalesKpiPayoutFactorFromRun(run: PayrollRunKpiSnapshot): Decimal {
  const plan = run.kpiSalesPlanAmount != null ? new Decimal(run.kpiSalesPlanAmount) : null;
  const actual = run.kpiSalesActualAmount != null ? new Decimal(run.kpiSalesActualAmount) : null;
  if (plan == null || actual == null || plan.lte(0)) {
    return ONE;
  }
  return computeSalesKpiPayoutFactor(plan, actual);
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
