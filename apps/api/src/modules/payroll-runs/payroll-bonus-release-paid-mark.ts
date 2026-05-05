import { PrismaClient } from '@nbos/database';
import { refreshBonusEntryStatusAfterReleasesChange } from '../bonus/bonus-entry-status-sync';
import { syncProductBonusPoolForOrder } from '../bonus/product-bonus-pool-sync';

/**
 * When a payroll salary line is fully paid via its expense card, marks matching
 * `INCLUDED_IN_PAYROLL` bonus releases as `PAID` and refreshes bonus entries / product pools.
 */
export async function markPayrollBonusReleasesPaidForSalaryLine(
  prisma: InstanceType<typeof PrismaClient>,
  params: { payrollRunId: string; employeeId: string },
): Promise<void> {
  const releases = await prisma.bonusRelease.findMany({
    where: {
      payrollRunId: params.payrollRunId,
      employeeId: params.employeeId,
      status: 'INCLUDED_IN_PAYROLL',
    },
    select: { id: true, bonusEntryId: true },
  });
  if (releases.length === 0) {
    return;
  }

  await prisma.bonusRelease.updateMany({
    where: { id: { in: releases.map((r) => r.id) } },
    data: { status: 'PAID' },
  });

  const entryIds = [...new Set(releases.map((r) => r.bonusEntryId))];
  const orderIds = new Set<string>();

  for (const entryId of entryIds) {
    await refreshBonusEntryStatusAfterReleasesChange(prisma, entryId);
    const row = await prisma.bonusEntry.findUnique({
      where: { id: entryId },
      select: { orderId: true },
    });
    if (row) {
      orderIds.add(row.orderId);
    }
  }

  for (const orderId of orderIds) {
    await syncProductBonusPoolForOrder(prisma, orderId);
  }
}
