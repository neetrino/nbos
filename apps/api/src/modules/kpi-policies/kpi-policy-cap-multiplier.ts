import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';

import {
  BONUS_PAYROLL_CAP_BASE_SALARY_MULTIPLIER,
  BONUS_PAYROLL_CAP_MULTIPLIER_MAX,
  BONUS_PAYROLL_CAP_MULTIPLIER_MIN,
} from '../payroll-runs/payroll-bonus-cap.constants';

export function assertBonusCapBaseSalaryMultiplierInput(value: number | undefined): Decimal {
  if (value == null) {
    return new Decimal(BONUS_PAYROLL_CAP_BASE_SALARY_MULTIPLIER);
  }
  if (
    !Number.isFinite(value) ||
    value < BONUS_PAYROLL_CAP_MULTIPLIER_MIN ||
    value > BONUS_PAYROLL_CAP_MULTIPLIER_MAX
  ) {
    throw new BadRequestException(
      `bonusCapBaseSalaryMultiplier must be between ${BONUS_PAYROLL_CAP_MULTIPLIER_MIN} and ${BONUS_PAYROLL_CAP_MULTIPLIER_MAX}`,
    );
  }
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function bonusCapMultiplierToApiString(value: Decimal): string {
  return value.toFixed(2);
}
