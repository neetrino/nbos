import { BadRequestException } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@nbos/database';

import type { CompensationPayrollPolicy } from '../compensation-profiles/resolve-compensation-payroll-policy';
import { earnedSalesPeriodForPayoutMonth } from '../payroll-runs/earned-sales-kpi-period';
import { isSalesBonusEligibleForPayrollMonth } from '../payroll-runs/payroll-bonus-release-base';

type AttachDb = Pick<InstanceType<typeof PrismaClient>, 'bonusEntry'>;

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

/**
 * Payroll attach reads frozen bonus snapshots only — no KPI sync or recalculation here.
 */
export async function assertSalesBonusReadyForPayrollAttach(
  db: AttachDb,
  params: {
    bonusEntryId: string;
    payrollMonth: string;
    payrollPolicy: CompensationPayrollPolicy;
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
        `Only bonuses earned in ${expectedEarnedPeriod} can be included.`,
    );
  }

  if (params.payrollPolicy.kpiPolicyId == null) {
    return;
  }

  if (entry.payableAmount == null || entry.kpiPayoutFactor == null) {
    throw new BadRequestException(
      `${bonusLabel} is not ready for payroll. ` +
        `Sync Sales KPI for earned month ${entry.earnedPeriod ?? '—'}, then retry.`,
    );
  }
}
