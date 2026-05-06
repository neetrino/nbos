import { PrismaClient } from '@nbos/database';
import { refreshBonusEntryStatusAfterReleasesChange } from '../bonus/bonus-entry-status-sync';
import { syncProductBonusPoolForOrder } from '../bonus/product-bonus-pool-sync';
import { notifyBonusReleasePaid } from '../employees/employee-wallet-notify.ops';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';

/**
 * When a payroll salary line is fully paid via its expense card, marks matching
 * `INCLUDED_IN_PAYROLL` bonus releases as `PAID` and refreshes bonus entries / product pools.
 */
export async function markPayrollBonusReleasesPaidForSalaryLine(
  prisma: InstanceType<typeof PrismaClient>,
  params: { payrollRunId: string; employeeId: string },
  notify?: WalletInAppNotifySink,
): Promise<void> {
  const releases = await prisma.bonusRelease.findMany({
    where: {
      payrollRunId: params.payrollRunId,
      employeeId: params.employeeId,
      status: 'INCLUDED_IN_PAYROLL',
    },
    select: { id: true, bonusEntryId: true, amount: true },
  });
  if (releases.length === 0) {
    return;
  }

  await prisma.bonusRelease.updateMany({
    where: { id: { in: releases.map((r) => r.id) } },
    data: { status: 'PAID' },
  });

  const run = await prisma.payrollRun.findUnique({
    where: { id: params.payrollRunId },
    select: { payrollMonth: true },
  });
  const payrollMonth = run?.payrollMonth ?? null;

  const enriched = await prisma.bonusRelease.findMany({
    where: { id: { in: releases.map((r) => r.id) } },
    select: {
      id: true,
      amount: true,
      bonusEntry: { select: { order: { select: { code: true } } } },
    },
  });

  for (const r of enriched) {
    await notifyBonusReleasePaid(notify, {
      employeeId: params.employeeId,
      releaseId: r.id,
      orderCode: r.bonusEntry.order.code,
      amountLabel: r.amount.toFixed(2),
      payrollMonth,
    });
  }

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
    await syncProductBonusPoolForOrder(prisma, orderId, notify);
  }
}
