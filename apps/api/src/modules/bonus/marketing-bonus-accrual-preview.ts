import { BadRequestException } from '@nestjs/common';
import { Decimal, type Prisma, type PrismaClient } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';
import {
  MARKETING_BONUS_AMOUNT_PER_MQL,
  MARKETING_BONUS_AMOUNT_PER_SQL,
} from './marketing-bonus-accrual.constants';
import { parsePayrollMonthToUtcRange } from '../payroll-runs/payroll-run-suggested-sales-actual';
import { PAYROLL_MONTH_REGEX } from '../payroll-runs/payroll-runs.constants';

export interface MarketingBonusAccrualPreviewRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  mqlCount: number;
  sqlCount: number;
  suggestedAmount: string;
}

export interface MarketingBonusAccrualPreviewDto {
  payrollMonth: string;
  ratesConfigured: boolean;
  amountPerSql: string;
  amountPerMql: string;
  rows: MarketingBonusAccrualPreviewRow[];
  totals: {
    mqlCount: number;
    sqlCount: number;
    suggestedAmount: string;
  };
  note: string;
}

function marketingLeadWhere(range: { gte: Date; lt: Date }): Prisma.LeadWhereInput {
  return {
    assignedTo: { not: null },
    status: { in: ['MQL', 'SQL'] },
    createdAt: { gte: range.gte, lt: range.lt },
    OR: [
      { source: 'MARKETING' },
      { marketingActivityId: { not: null } },
      { marketingAccountId: { not: null } },
    ],
  };
}

function computeSuggestedAmount(mqlCount: number, sqlCount: number): Decimal {
  const perSql = new Decimal(MARKETING_BONUS_AMOUNT_PER_SQL);
  const perMql = new Decimal(MARKETING_BONUS_AMOUNT_PER_MQL);
  return perMql.times(mqlCount).plus(perSql.times(sqlCount));
}

/**
 * Preview MARKETING planned bonuses from attributed leads (MQL/SQL) in a payroll month.
 * Does not create `BonusEntry` rows (requires anchor order + apply flow).
 */
export async function queryMarketingBonusAccrualPreview(
  prisma: PrismaClient,
  payrollMonth: string,
): Promise<MarketingBonusAccrualPreviewDto> {
  const month = payrollMonth.trim();
  if (!PAYROLL_MONTH_REGEX.test(month)) {
    throw new BadRequestException('payrollMonth must be YYYY-MM');
  }

  const range = parsePayrollMonthToUtcRange(month);
  if (!range) {
    throw new BadRequestException('payrollMonth must be YYYY-MM');
  }

  const ratesConfigured = MARKETING_BONUS_AMOUNT_PER_SQL > 0 || MARKETING_BONUS_AMOUNT_PER_MQL > 0;

  const groups = await prisma.lead.groupBy({
    by: ['assignedTo', 'status'],
    where: marketingLeadWhere(range),
    _count: { _all: true },
  });

  const byEmployee = new Map<string, { mqlCount: number; sqlCount: number }>();
  for (const row of groups) {
    const employeeId = row.assignedTo;
    if (employeeId == null) {
      continue;
    }
    const bucket = byEmployee.get(employeeId) ?? { mqlCount: 0, sqlCount: 0 };
    if (row.status === 'MQL') {
      bucket.mqlCount += row._count._all;
    } else if (row.status === 'SQL') {
      bucket.sqlCount += row._count._all;
    }
    byEmployee.set(employeeId, bucket);
  }

  const employeeIds = [...byEmployee.keys()];
  const employees =
    employeeIds.length > 0
      ? await prisma.employee.findMany({
          where: { id: { in: employeeIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
  const nameById = new Map(employees.map((e) => [e.id, e]));

  let totalMql = 0;
  let totalSql = 0;
  let totalSuggested = BONUS_POOL_ZERO;

  const rows: MarketingBonusAccrualPreviewRow[] = [];
  for (const [employeeId, counts] of byEmployee) {
    totalMql += counts.mqlCount;
    totalSql += counts.sqlCount;
    const suggested = computeSuggestedAmount(counts.mqlCount, counts.sqlCount);
    totalSuggested = totalSuggested.plus(suggested);
    const emp = nameById.get(employeeId);
    rows.push({
      employeeId,
      firstName: emp?.firstName ?? '',
      lastName: emp?.lastName ?? '',
      mqlCount: counts.mqlCount,
      sqlCount: counts.sqlCount,
      suggestedAmount: suggested.toFixed(2),
    });
  }

  rows.sort((a, b) => {
    const an = `${a.lastName} ${a.firstName}`.trim();
    const bn = `${b.lastName} ${b.firstName}`.trim();
    return an.localeCompare(bn);
  });

  return {
    payrollMonth: month,
    ratesConfigured,
    amountPerSql: decimalFrom(MARKETING_BONUS_AMOUNT_PER_SQL).toFixed(2),
    amountPerMql: decimalFrom(MARKETING_BONUS_AMOUNT_PER_MQL).toFixed(2),
    rows,
    totals: {
      mqlCount: totalMql,
      sqlCount: totalSql,
      suggestedAmount: totalSuggested.toFixed(2),
    },
    note: ratesConfigured
      ? 'Suggested amounts use per-MQL/SQL rates. Apply creates one INCOMING MARKETING entry per employee (company anchor order).'
      : 'Rates are not configured (preview counts only). Set marketing-bonus-accrual.constants.ts.',
  };
}
