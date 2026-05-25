import { Decimal, type BonusTypeEnum, type PrismaClient } from '@nbos/database';
import type { InputJsonValue } from '@nbos/database';

import { BONUS_POOL_ZERO } from './bonus-pool-decimal';
import type { CompanyBonusAnchor } from './company-bonus-anchor';
import { payrollMonthToPayoutDate } from './payroll-month-payout-date';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

export interface PlannedBonusAccrualRowInput {
  employeeId: string;
  amount: Decimal;
  accrualKind: string;
  snapshot: Record<string, unknown>;
}

export interface PlannedBonusAccrualApplyResult {
  payrollMonth: string;
  anchor: CompanyBonusAnchor;
  created: number;
  skipped: number;
  skippedEmployeeIds: string[];
}

export async function persistPlannedBonusAccrual(
  prisma: PrismaClient,
  params: {
    payrollMonth: string;
    anchor: CompanyBonusAnchor;
    bonusType: BonusTypeEnum;
    rows: PlannedBonusAccrualRowInput[];
  },
): Promise<PlannedBonusAccrualApplyResult> {
  const payoutMonth = payrollMonthToPayoutDate(params.payrollMonth);
  let created = 0;
  let skipped = 0;
  const skippedEmployeeIds: string[] = [];

  for (const row of params.rows) {
    if (row.amount.lte(BONUS_POOL_ZERO)) {
      continue;
    }

    const existing = await prisma.bonusEntry.findFirst({
      where: {
        employeeId: row.employeeId,
        type: params.bonusType,
        orderId: params.anchor.orderId,
        payoutMonth,
      },
      select: { id: true },
    });
    if (existing != null) {
      skipped += 1;
      skippedEmployeeIds.push(row.employeeId);
      continue;
    }

    await prisma.bonusEntry.create({
      data: {
        employeeId: row.employeeId,
        orderId: params.anchor.orderId,
        projectId: params.anchor.projectId,
        type: params.bonusType,
        amount: row.amount,
        percent: new Decimal(0),
        status: 'INCOMING',
        payoutMonth,
        calculationSnapshot: {
          ...row.snapshot,
          accrualKind: row.accrualKind,
          payrollMonth: params.payrollMonth,
        } as InputJsonValue,
      },
    });
    created += 1;
  }

  if (created > 0) {
    await syncProductBonusPoolForOrder(prisma, params.anchor.orderId);
  }

  return {
    payrollMonth: params.payrollMonth,
    anchor: params.anchor,
    created,
    skipped,
    skippedEmployeeIds,
  };
}
