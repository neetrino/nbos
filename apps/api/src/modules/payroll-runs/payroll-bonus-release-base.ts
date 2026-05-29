import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { earnedSalesPeriodForPayoutMonth } from './earned-sales-kpi-period';

export type PayrollBonusReleaseBaseInput = {
  type: string;
  amount: Decimal | string | number;
  payableAmount: Decimal | string | number | null;
  earnedPeriod?: string | null;
  /** When false, Sales bonus uses full `amount` (no KPI policy on compensation profile). */
  hasKpiPolicy?: boolean;
};

/** Sales bonuses for payroll month M use earned period M−1 only. */
export function isSalesBonusEligibleForPayrollMonth(
  entry: Pick<PayrollBonusReleaseBaseInput, 'type' | 'earnedPeriod'>,
  payrollMonth: string,
): boolean {
  if (entry.type !== 'SALES') {
    return true;
  }
  const earnedPeriod = entry.earnedPeriod?.trim() ?? '';
  if (earnedPeriod.length === 0) {
    return false;
  }
  return earnedPeriod === earnedSalesPeriodForPayoutMonth(payrollMonth);
}

/** Amount Finance can release in payroll for this bonus entry. */
export function payrollBonusReleaseBase(
  entry: PayrollBonusReleaseBaseInput,
  payrollMonth: string,
): Decimal {
  if (entry.type === 'SALES') {
    if (!isSalesBonusEligibleForPayrollMonth(entry, payrollMonth)) {
      return BONUS_POOL_ZERO;
    }
    if (entry.hasKpiPolicy === false) {
      return decimalFrom(entry.amount);
    }
    return entry.payableAmount != null ? decimalFrom(entry.payableAmount) : BONUS_POOL_ZERO;
  }
  return decimalFrom(entry.amount);
}

/** Whether a bonus entry should appear as linked in the payroll allocation matrix. */
export function isPayrollMatrixBonusEntryVisible(
  entry: PayrollBonusReleaseBaseInput,
  payrollMonth: string,
): boolean {
  if (entry.type !== 'SALES') {
    return true;
  }
  if (!isSalesBonusEligibleForPayrollMonth(entry, payrollMonth)) {
    return false;
  }
  if (entry.hasKpiPolicy === false) {
    return true;
  }
  return entry.payableAmount != null;
}
