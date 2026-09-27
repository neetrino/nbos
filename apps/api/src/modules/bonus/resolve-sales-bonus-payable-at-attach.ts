import { BadRequestException } from '@nestjs/common';
import { Decimal, Prisma, type PrismaClient } from '@nbos/database';

import { earnedSalesPeriodForPayoutMonth } from '../payroll-runs/earned-sales-kpi-period';
import { isSalesBonusEligibleForPayrollMonth } from '../payroll-runs/payroll-bonus-release-base';
import {
  assertOrdinaryCountingWithinSalesPayable,
  isSalesExceptionReleaseType,
  sumOrdinaryCountingReleases,
} from './bonus-release-entry-cap';

type AttachDb = Pick<InstanceType<typeof PrismaClient>, 'bonusEntry' | 'bonusRelease'>;

const entrySelect = {
  id: true,
  title: true,
  type: true,
  employeeId: true,
  amount: true,
  earnedPeriod: true,
  payableAmount: true,
  kpiPayoutFactor: true,
  employee: { select: { firstName: true, lastName: true } },
  order: { select: { code: true } },
} as const;

type SalesBonusAttachEntry = Prisma.BonusEntryGetPayload<{
  select: typeof entrySelect;
}>;

function formatSalesBonusAttachLabel(entry: SalesBonusAttachEntry): string {
  const employeeName = [entry.employee.firstName, entry.employee.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const bonusLabel = entry.title?.trim() || `Order ${entry.order.code}`;
  return employeeName ? `${bonusLabel} (${employeeName})` : bonusLabel;
}

export function assertSalesReleaseAmountWithinPayable(
  releaseAmount: Decimal,
  payableAmount: Decimal,
  bonusLabel: string,
): void {
  if (releaseAmount.gt(payableAmount)) {
    throw new BadRequestException(
      `${bonusLabel} release exceeds the Sales KPI payable of ${payableAmount.toFixed(2)}.`,
    );
  }
}

/** Payroll attach reads frozen bonus payable snapshots only — no KPI sync here. */
export async function assertSalesBonusReadyForPayrollAttach(
  db: AttachDb,
  params: {
    bonusEntryId: string;
    payrollMonth: string;
    releaseAmount: Decimal;
    releaseType: string;
  },
): Promise<void> {
  const entry = await db.bonusEntry.findUnique({
    where: { id: params.bonusEntryId },
    select: entrySelect,
  });
  if (!entry || entry.type !== 'SALES') {
    throw new BadRequestException('Sales bonus not found.');
  }

  const bonusLabel = formatSalesBonusAttachLabel(entry);
  const expectedEarnedPeriod = earnedSalesPeriodForPayoutMonth(params.payrollMonth);

  if (!isSalesBonusEligibleForPayrollMonth(entry, params.payrollMonth)) {
    throw new BadRequestException(
      `${bonusLabel} is not eligible for payroll month ${params.payrollMonth}. ` +
        `Only bonuses already earned through ${expectedEarnedPeriod} can be included.`,
    );
  }

  if (entry.payableAmount == null) {
    throw new BadRequestException(
      `${bonusLabel} is not ready for payroll. ` +
        `Sync Sales KPI for earned month ${entry.earnedPeriod ?? '—'}, then retry.`,
    );
  }
  assertSalesReleaseAmountWithinPayable(params.releaseAmount, entry.payableAmount, bonusLabel);
  if (isSalesExceptionReleaseType(params.releaseType)) {
    return;
  }
  const ordinaryTotal = await sumOrdinaryCountingReleases(db, entry.id);
  assertOrdinaryCountingWithinSalesPayable(ordinaryTotal, entry.payableAmount, bonusLabel);
}
