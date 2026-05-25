import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { Decimal } from '@nbos/database';

import { resolveCompanyBonusAnchor } from './company-bonus-anchor';
import {
  persistPlannedBonusAccrual,
  type PlannedBonusAccrualApplyResult,
} from './planned-bonus-accrual-persist';
import { querySupportBonusAccrualPreview } from './support-bonus-accrual-preview';

const SUPPORT_ACCRUAL_KIND = 'SUPPORT_SLA_MONTH';

export async function applySupportBonusAccrual(
  prisma: PrismaClient,
  payrollMonth: string,
): Promise<PlannedBonusAccrualApplyResult> {
  const preview = await querySupportBonusAccrualPreview(prisma, payrollMonth);
  if (!preview.ratesConfigured) {
    throw new BadRequestException('Support bonus rates are not configured.');
  }

  const anchor = await resolveCompanyBonusAnchor(prisma);
  const rows = preview.rows
    .filter((r) => new Decimal(r.suggestedAmount).gt(0))
    .map((r) => ({
      employeeId: r.employeeId,
      amount: new Decimal(r.suggestedAmount),
      accrualKind: SUPPORT_ACCRUAL_KIND,
      snapshot: {
        slaMetCount: r.slaMetCount,
        amountPerSlaResolved: preview.amountPerSlaResolved,
      },
    }));

  return persistPlannedBonusAccrual(prisma, {
    payrollMonth,
    anchor,
    bonusType: 'MARKETING',
    rows,
  });
}
