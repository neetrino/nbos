import type { PrismaClient } from '@nbos/database';

import { decimalFrom } from '../bonus/bonus-pool-decimal';
import type { UnitEconomicsBonusLineDto } from './unit-economics.types';

function employeeName(employee: { firstName: string; lastName: string }): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export async function loadUnitEconomicsOrderBonuses(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
): Promise<UnitEconomicsBonusLineDto[]> {
  const entries = await prisma.bonusEntry.findMany({
    where: { orderId },
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      payableAmount: true,
      earnedPeriod: true,
      title: true,
      employee: { select: { firstName: true, lastName: true } },
      bonusReleases: {
        select: { amount: true, status: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return entries.map((entry) => {
    let released = decimalFrom(0);
    let paid = decimalFrom(0);
    for (const rel of entry.bonusReleases) {
      const amt = decimalFrom(rel.amount);
      if (rel.status === 'PAID') {
        paid = paid.plus(amt);
      }
      if (rel.status === 'INCLUDED_IN_PAYROLL' || rel.status === 'PAID') {
        released = released.plus(amt);
      }
    }
    const full = decimalFrom(entry.amount);
    const payable = entry.payableAmount != null ? decimalFrom(entry.payableAmount) : full;
    return {
      bonusEntryId: entry.id,
      employeeName: employeeName(entry.employee),
      type: entry.type,
      status: entry.status,
      title: entry.title,
      fullAmount: full.toFixed(2),
      payableAmount: payable.toFixed(2),
      releasedAmount: released.toFixed(2),
      paidAmount: paid.toFixed(2),
      earnedPeriod: entry.earnedPeriod,
    };
  });
}
