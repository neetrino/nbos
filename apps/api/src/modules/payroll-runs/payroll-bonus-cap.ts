import { Decimal } from '@nbos/database';

import { BONUS_PAYROLL_CAP_BASE_SALARY_MULTIPLIER } from './payroll-bonus-cap.constants';

const ZERO = new Decimal(0);

export type PayrollBonusCapApplyResult = {
  payrollIncludedAmount: Decimal;
  payrollCarryOverAmount: Decimal | null;
};

function roundMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Max bonuses on a salary line this month (base × multiplier). */
export function computeMonthlyBonusCap(
  baseSalary: Decimal,
  bonusCapBaseSalaryMultiplier: Decimal = new Decimal(BONUS_PAYROLL_CAP_BASE_SALARY_MULTIPLIER),
): Decimal {
  return roundMoney(baseSalary.mul(bonusCapBaseSalaryMultiplier));
}

/**
 * Limits KPI-scaled attach amount to remaining room under the monthly bonus cap.
 * Carry-over is deferred payout (next month), distinct from SALES KPI burned.
 */
export function applyPayrollBonusCap(params: {
  kpiScaledAmount: Decimal;
  currentBonusesTotal: Decimal;
  baseSalary: Decimal;
  bonusCapBaseSalaryMultiplier?: Decimal;
}): PayrollBonusCapApplyResult {
  const scaled = roundMoney(params.kpiScaledAmount);
  if (params.baseSalary.lte(0)) {
    return { payrollIncludedAmount: scaled, payrollCarryOverAmount: null };
  }

  const multiplier =
    params.bonusCapBaseSalaryMultiplier ?? new Decimal(BONUS_PAYROLL_CAP_BASE_SALARY_MULTIPLIER);
  const capMax = computeMonthlyBonusCap(params.baseSalary, multiplier);
  const room = Decimal.max(ZERO, capMax.minus(params.currentBonusesTotal));
  if (scaled.lte(room)) {
    return { payrollIncludedAmount: scaled, payrollCarryOverAmount: null };
  }

  const included = roundMoney(room);
  const carry = roundMoney(scaled.minus(included));
  return {
    payrollIncludedAmount: included,
    payrollCarryOverAmount: carry.gt(0) ? carry : null,
  };
}
