import { addPayrollMonths } from './payroll-salary-board';

/**
 * Sales bonuses earned in month M are paid in payroll month M+1;
 * KPI Result period is the earned sales month (not the payout payroll month).
 */
export function earnedBonusPeriodForPayoutMonth(payoutMonth: string): string {
  return addPayrollMonths(payoutMonth, -1);
}

export function earnedSalesPeriodForPayoutMonth(payoutMonth: string): string {
  return earnedBonusPeriodForPayoutMonth(payoutMonth);
}
