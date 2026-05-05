import { Decimal, type PrismaClient } from '@nbos/database';

import { decimalFrom, BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';

import { PAYROLL_MONTH_REGEX } from './payroll-runs.constants';

/**
 * Inclusive start (UTC midnight) and exclusive end for the calendar month of `YYYY-MM`.
 * Returns null if `payrollMonth` is not a valid payroll month key.
 */
export function parsePayrollMonthToUtcRange(payrollMonth: string): { gte: Date; lt: Date } | null {
  if (!PAYROLL_MONTH_REGEX.test(payrollMonth)) return null;
  const [yearStr, monthStr] = payrollMonth.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }
  const gte = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const lt = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
  return { gte, lt };
}

/**
 * Suggested KPI sales actual for a payroll month: sum of `Payment.amount` where
 * `paymentDate` falls in that calendar month (UTC). Aligns with payment aggregates
 * that filter by `paymentDate` only (see PaymentsService).
 */
export async function sumPaymentsForPayrollMonthSuggestedSalesKpi(
  prisma: PrismaClient,
  payrollMonth: string,
): Promise<Decimal> {
  const range = parsePayrollMonthToUtcRange(payrollMonth);
  if (!range) return BONUS_POOL_ZERO;

  const agg = await prisma.payment.aggregate({
    where: {
      paymentDate: { gte: range.gte, lt: range.lt },
    },
    _sum: { amount: true },
  });

  return decimalFrom(agg._sum.amount);
}
