import { Decimal } from '@nbos/database';

import {
  BONUS_PAYROLL_CAP_BASE_SALARY_MULTIPLIER,
  BONUS_PAYROLL_CAP_MULTIPLIER_MAX,
  BONUS_PAYROLL_CAP_MULTIPLIER_MIN,
} from './payroll-bonus-cap.constants';

/** Platform default when profile has no KPI policy or field unset. */
export function defaultBonusCapBaseSalaryMultiplier(): Decimal {
  return new Decimal(BONUS_PAYROLL_CAP_BASE_SALARY_MULTIPLIER);
}

/**
 * Parses persisted policy multiplier; clamps to allowed NBOS range.
 */
export function parseBonusCapBaseSalaryMultiplier(
  value: Decimal | number | string | null | undefined,
): Decimal {
  if (value == null) {
    return defaultBonusCapBaseSalaryMultiplier();
  }
  const n = new Decimal(value);
  if (!n.isFinite() || n.lt(BONUS_PAYROLL_CAP_MULTIPLIER_MIN)) {
    return defaultBonusCapBaseSalaryMultiplier();
  }
  if (n.gt(BONUS_PAYROLL_CAP_MULTIPLIER_MAX)) {
    return new Decimal(BONUS_PAYROLL_CAP_MULTIPLIER_MAX);
  }
  return n.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
