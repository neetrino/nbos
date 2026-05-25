import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { Decimal } from '@nbos/database';

import { resolveCompanyBonusAnchor } from './company-bonus-anchor';
import { queryMarketingBonusAccrualPreview } from './marketing-bonus-accrual-preview';
import {
  persistPlannedBonusAccrual,
  type PlannedBonusAccrualApplyResult,
} from './planned-bonus-accrual-persist';

const MARKETING_ACCRUAL_KIND = 'MARKETING_LEAD_MONTH';

export async function applyMarketingBonusAccrual(
  prisma: PrismaClient,
  payrollMonth: string,
): Promise<PlannedBonusAccrualApplyResult> {
  const preview = await queryMarketingBonusAccrualPreview(prisma, payrollMonth);
  if (!preview.ratesConfigured) {
    throw new BadRequestException(
      'Marketing bonus rates are not configured (per-MQL/SQL amounts are zero).',
    );
  }

  const anchor = await resolveCompanyBonusAnchor(prisma);
  const rows = preview.rows
    .filter((r) => new Decimal(r.suggestedAmount).gt(0))
    .map((r) => ({
      employeeId: r.employeeId,
      amount: new Decimal(r.suggestedAmount),
      accrualKind: MARKETING_ACCRUAL_KIND,
      snapshot: {
        mqlCount: r.mqlCount,
        sqlCount: r.sqlCount,
        amountPerSql: preview.amountPerSql,
        amountPerMql: preview.amountPerMql,
      },
    }));

  return persistPlannedBonusAccrual(prisma, {
    payrollMonth,
    anchor,
    bonusType: 'MARKETING',
    rows,
  });
}
