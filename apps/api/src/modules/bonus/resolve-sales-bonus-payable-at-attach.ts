import { Decimal, type PrismaClient } from '@nbos/database';

import type { CompensationPayrollPolicy } from '../compensation-profiles/resolve-compensation-payroll-policy';
import { refreshSalesBonusesForEarnedMonth } from './sales-bonus-kpi-payable';

type AttachDb = Pick<
  InstanceType<typeof PrismaClient>,
  'bonusEntry' | 'kpiResult' | 'kpiPolicy' | 'compensationProfile'
>;

export type SalesBonusPayableAtAttach = {
  fullAmount: Decimal;
  kpiScaledAmount: Decimal;
  kpiFactor: Decimal;
};

/**
 * Payroll attach uses frozen `payableAmount` on the bonus entry (earned month KPI),
 * not payroll month − 1.
 */
export async function resolveSalesBonusPayableAtAttach(
  db: AttachDb,
  params: {
    bonusEntryId: string;
    payrollPolicy: CompensationPayrollPolicy;
  },
): Promise<SalesBonusPayableAtAttach> {
  let entry = await db.bonusEntry.findUnique({
    where: { id: params.bonusEntryId },
    select: {
      id: true,
      employeeId: true,
      amount: true,
      earnedPeriod: true,
      payableAmount: true,
      kpiPayoutFactor: true,
    },
  });
  if (!entry) {
    throw new Error(`Bonus entry ${params.bonusEntryId} not found`);
  }

  if (
    (entry.payableAmount == null || entry.kpiPayoutFactor == null) &&
    entry.earnedPeriod != null
  ) {
    await refreshSalesBonusesForEarnedMonth(db, {
      employeeId: entry.employeeId,
      earnedPeriod: entry.earnedPeriod,
    });
    entry = await db.bonusEntry.findUnique({
      where: { id: params.bonusEntryId },
      select: {
        id: true,
        employeeId: true,
        amount: true,
        earnedPeriod: true,
        payableAmount: true,
        kpiPayoutFactor: true,
      },
    });
    if (!entry) {
      throw new Error(`Bonus entry ${params.bonusEntryId} not found after KPI refresh`);
    }
  }

  if (params.payrollPolicy.kpiPolicyId == null) {
    return {
      fullAmount: entry.amount,
      kpiScaledAmount: entry.amount,
      kpiFactor: new Decimal(1),
    };
  }

  if (entry.payableAmount == null || entry.kpiPayoutFactor == null) {
    throw new Error(
      `Sales bonus ${params.bonusEntryId} has no payable snapshot for earned period ${entry.earnedPeriod ?? '—'}`,
    );
  }

  return {
    fullAmount: entry.amount,
    kpiScaledAmount: entry.payableAmount,
    kpiFactor: entry.kpiPayoutFactor,
  };
}
