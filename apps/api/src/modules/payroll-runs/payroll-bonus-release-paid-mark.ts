import { PrismaClient } from '@nbos/database';
import { refreshBonusEntryStatusAfterReleasesChange } from '../bonus/bonus-entry-status-sync';
import { syncProductBonusPoolForOrder } from '../bonus/product-bonus-pool-sync';
import { notifyBonusReleasePaid } from '../employees/employee-wallet-notify.ops';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';

export type MarkPayrollBonusReleasesPaidParams = {
  payrollRunId: string;
  employeeId: string;
  /** When set, only these included releases are marked. An empty list marks none. */
  releaseIds?: string[];
};

/**
 * Marks matching `INCLUDED_IN_PAYROLL` bonus releases as `PAID` after cash attribution.
 * Does not mark drafts. Pass `releaseIds: []` to mark none.
 */
export async function markPayrollBonusReleasesPaidForSalaryLine(
  prisma: InstanceType<typeof PrismaClient>,
  params: MarkPayrollBonusReleasesPaidParams,
  notify?: WalletInAppNotifySink,
): Promise<void> {
  if (params.releaseIds != null && params.releaseIds.length === 0) {
    return;
  }
  const releases = await prisma.bonusRelease.findMany({
    where: {
      payrollRunId: params.payrollRunId,
      employeeId: params.employeeId,
      status: 'INCLUDED_IN_PAYROLL',
      ...(params.releaseIds != null ? { id: { in: params.releaseIds } } : {}),
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

  await notifyAndRefreshPaidReleases(prisma, params, releases, notify);
}

async function notifyAndRefreshPaidReleases(
  prisma: InstanceType<typeof PrismaClient>,
  params: MarkPayrollBonusReleasesPaidParams,
  releases: { id: string; bonusEntryId: string; amount: { toFixed: (digits: number) => string } }[],
  notify?: WalletInAppNotifySink,
): Promise<void> {
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

  await refreshPaidReleaseEntries(prisma, releases, notify);
}

async function refreshPaidReleaseEntries(
  prisma: InstanceType<typeof PrismaClient>,
  releases: { bonusEntryId: string }[],
  notify?: WalletInAppNotifySink,
): Promise<void> {
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
