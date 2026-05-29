import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { earnedBonusPeriodForPayoutMonth } from './earned-sales-kpi-period';

export type PayrollBonusReleaseBaseInput = {
  type: string;
  amount: Decimal | string | number;
  payableAmount: Decimal | string | number | null;
  earnedPeriod?: string | null;
};

/** Bonuses for payroll month M use earned period M−1 only. */
export function isBonusEligibleForPayrollMonth(
  entry: Pick<PayrollBonusReleaseBaseInput, 'type' | 'earnedPeriod'>,
  payrollMonth: string,
): boolean {
  const earnedPeriod = entry.earnedPeriod?.trim() ?? '';
  if (earnedPeriod.length === 0) {
    return false;
  }
  return earnedPeriod === earnedBonusPeriodForPayoutMonth(payrollMonth);
}

/** @deprecated Use `isBonusEligibleForPayrollMonth`; kept for Sales KPI attach copy. */
export function isSalesBonusEligibleForPayrollMonth(
  entry: Pick<PayrollBonusReleaseBaseInput, 'type' | 'earnedPeriod'>,
  payrollMonth: string,
): boolean {
  return entry.type === 'SALES' && isBonusEligibleForPayrollMonth(entry, payrollMonth);
}

/** Amount Finance can release in payroll for this bonus entry. */
export function payrollBonusReleaseBase(
  entry: PayrollBonusReleaseBaseInput,
  payrollMonth: string,
): Decimal {
  if (!isBonusEligibleForPayrollMonth(entry, payrollMonth)) {
    return BONUS_POOL_ZERO;
  }
  if (entry.payableAmount != null) {
    return decimalFrom(entry.payableAmount);
  }
  return decimalFrom(entry.amount);
}

/** Whether a bonus entry should appear as linked in the payroll allocation matrix. */
export function isPayrollMatrixBonusEntryVisible(
  entry: PayrollBonusReleaseBaseInput,
  payrollMonth: string,
): boolean {
  if (!isBonusEligibleForPayrollMonth(entry, payrollMonth)) {
    return false;
  }
  if (entry.type === 'SALES') {
    return entry.payableAmount != null;
  }
  return true;
}
