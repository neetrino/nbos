import { PrismaClient } from '@nbos/database';

import { decimalFrom } from '../bonus/bonus-pool-decimal';

/**
 * Restores `PAID` bonus releases to `INCLUDED_IN_PAYROLL` after cash attribution is reversed.
 * A bonus entry that is no longer covered by paid releases leaves `PAID`, so the wallet
 * shows the restored remainder instead of cash that was paid.
 */
export async function restorePayrollBonusReleasesIncludedForSalaryLine(
  prisma: InstanceType<typeof PrismaClient>,
  releaseIds: string[],
): Promise<void> {
  if (releaseIds.length === 0) {
    return;
  }
  const releases = await prisma.bonusRelease.findMany({
    where: { id: { in: releaseIds } },
    select: { id: true, bonusEntryId: true, status: true },
  });
  await restorePaidReleases(prisma, releases);
  const entryIds = [...new Set(releases.map((row) => row.bonusEntryId))];
  for (const entryId of entryIds) {
    await reopenBonusEntryWhenPaidCashReturned(prisma, entryId);
  }
}

async function restorePaidReleases(
  prisma: InstanceType<typeof PrismaClient>,
  releases: { id: string; status: string }[],
): Promise<void> {
  const paidIds = releases.filter((row) => row.status === 'PAID').map((row) => row.id);
  if (paidIds.length === 0) {
    return;
  }
  await prisma.bonusRelease.updateMany({
    where: { id: { in: paidIds }, status: 'PAID' },
    data: { status: 'INCLUDED_IN_PAYROLL' },
  });
}

async function reopenBonusEntryWhenPaidCashReturned(
  prisma: InstanceType<typeof PrismaClient>,
  bonusEntryId: string,
): Promise<void> {
  const entry = await prisma.bonusEntry.findUnique({
    where: { id: bonusEntryId },
    select: { status: true, amount: true },
  });
  if (entry?.status !== 'PAID') {
    return;
  }
  const paid = await prisma.bonusRelease.aggregate({
    where: { bonusEntryId, status: 'PAID' },
    _sum: { amount: true },
  });
  const paidAmount = decimalFrom(paid._sum.amount);
  if (entry.amount.gt(0) && paidAmount.gte(entry.amount)) {
    return;
  }
  await prisma.bonusEntry.update({
    where: { id: bonusEntryId },
    data: { status: 'ACTIVE' },
  });
}
