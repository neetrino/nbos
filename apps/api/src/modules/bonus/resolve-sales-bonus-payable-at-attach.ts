import { BadRequestException } from '@nestjs/common';
import { Decimal, type PrismaClient } from '@nbos/database';

import type { CompensationPayrollPolicy } from '../compensation-profiles/resolve-compensation-payroll-policy';
import {
  applyPayableSnapshotToSalesEntry,
  refreshSalesBonusesForEarnedMonth,
} from './sales-bonus-kpi-payable';

type AttachDb = Pick<
  InstanceType<typeof PrismaClient>,
  'bonusEntry' | 'kpiResult' | 'kpiPolicy' | 'compensationProfile' | 'payment'
>;

const entrySelect = {
  id: true,
  title: true,
  employeeId: true,
  amount: true,
  earnedPeriod: true,
  payableAmount: true,
  kpiPayoutFactor: true,
  employee: { select: { firstName: true, lastName: true } },
  order: { select: { code: true } },
} as const;

type SalesBonusAttachEntry = NonNullable<Awaited<ReturnType<AttachDb['bonusEntry']['findUnique']>>>;

function formatSalesBonusAttachLabel(entry: SalesBonusAttachEntry): string {
  const employeeName = [entry.employee.firstName, entry.employee.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const bonusLabel = entry.title?.trim() || `Order ${entry.order.code}`;
  return employeeName ? `${bonusLabel} (${employeeName})` : bonusLabel;
}

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
    select: entrySelect,
  });
  if (!entry) {
    throw new BadRequestException('Sales bonus not found.');
  }

  const bonusLabel = formatSalesBonusAttachLabel(entry);

  if (
    (entry.payableAmount == null || entry.kpiPayoutFactor == null) &&
    entry.earnedPeriod != null
  ) {
    await refreshSalesBonusesForEarnedMonth(db, {
      employeeId: entry.employeeId,
      earnedPeriod: entry.earnedPeriod,
    });
    await applyPayableSnapshotToSalesEntry(db, params.bonusEntryId);
    entry = await db.bonusEntry.findUnique({
      where: { id: params.bonusEntryId },
      select: entrySelect,
    });
    if (!entry) {
      throw new BadRequestException(`${bonusLabel} could not be loaded after KPI sync.`);
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
    throw new BadRequestException(
      `${bonusLabel} has no KPI payout snapshot for earned month ${entry.earnedPeriod ?? '—'}. ` +
        'Sync Sales KPI for that month, then retry.',
    );
  }

  return {
    fullAmount: entry.amount,
    kpiScaledAmount: entry.payableAmount,
    kpiFactor: entry.kpiPayoutFactor,
  };
}
