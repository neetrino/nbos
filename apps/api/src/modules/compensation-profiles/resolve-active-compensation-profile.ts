import { type CompensationProfileStatusEnum, type TransactionClient } from '@nbos/database';
import { endOfPayrollMonthUtc, startOfPayrollMonthUtc } from './compensation-profile-payroll-month';

export type CompensationProfileDb = Pick<TransactionClient, 'compensationProfile'>;

export interface ResolvedCompensationProfile {
  id: string;
  baseSalary: { toString(): string };
  currency: string;
}

const ACTIVE: CompensationProfileStatusEnum = 'ACTIVE';

/**
 * Profile active for the full payroll month: effective_from <= month end
 * and (no effective_to or effective_to >= month start).
 */
export async function resolveCompensationProfileForPayrollMonth(
  db: CompensationProfileDb,
  employeeId: string,
  payrollMonth: string,
): Promise<ResolvedCompensationProfile | null> {
  const monthStart = startOfPayrollMonthUtc(payrollMonth);
  const monthEnd = endOfPayrollMonthUtc(payrollMonth);

  return db.compensationProfile.findFirst({
    where: {
      employeeId,
      status: ACTIVE,
      effectiveFrom: { lte: monthEnd },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }],
    },
    orderBy: { effectiveFrom: 'desc' },
    select: { id: true, baseSalary: true, currency: true },
  });
}
