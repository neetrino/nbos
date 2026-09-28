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

/**
 * Null remaining plus a positive original carry means the later month consumed
 * the whole carry. Both-null is a release with no cap carry.
 */
export function resolveConsumedPayrollCarryOver(params: {
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: Decimal | null;
}): Decimal {
  const original = params.payrollCarryOverAmount;
  if (original == null || original.lte(0)) {
    return ZERO;
  }
  if (params.payrollCarryOverRemaining == null) {
    return roundMoney(original);
  }
  return roundMoney(Decimal.max(ZERO, original.minus(params.payrollCarryOverRemaining)));
}

/** Re-attach includes the KPI-scaled amount minus carry already paid in a later month. */
export function resolveReattachIncludedAmount(params: {
  kpiScaledAmount: Decimal;
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: Decimal | null;
}): Decimal {
  const scaled = roundMoney(params.kpiScaledAmount);
  const consumed = resolveConsumedPayrollCarryOver(params);
  return roundMoney(Decimal.max(ZERO, scaled.minus(consumed)));
}

/**
 * After re-attach, remember only the later-month consumed amount. Remaining is
 * always null. Both-null means nothing was consumed.
 */
export function resolveRememberedConsumedCarryFields(params: {
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: Decimal | null;
}): {
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: null;
} {
  const consumed = resolveConsumedPayrollCarryOver(params);
  return {
    payrollCarryOverAmount: consumed.gt(0) ? consumed : null,
    payrollCarryOverRemaining: null,
  };
}

/** Stored policy multiple of base salary. Not applied as a monthly payout ceiling. */
export function computeMonthlyBonusCap(
  baseSalary: Decimal,
  bonusCapBaseSalaryMultiplier: Decimal = new Decimal(BONUS_PAYROLL_CAP_BASE_SALARY_MULTIPLIER),
): Decimal {
  return roundMoney(baseSalary.mul(bonusCapBaseSalaryMultiplier));
}

/**
 * Includes the full KPI-scaled attach amount. There is no monthly bonus ceiling
 * tied to a salary multiple, so no new cap carry-over is created.
 */
export function applyPayrollBonusCap(params: {
  kpiScaledAmount: Decimal;
  currentBonusesTotal: Decimal;
  baseSalary: Decimal;
  bonusCapBaseSalaryMultiplier?: Decimal;
}): PayrollBonusCapApplyResult {
  return {
    payrollIncludedAmount: roundMoney(params.kpiScaledAmount),
    payrollCarryOverAmount: null,
  };
}
