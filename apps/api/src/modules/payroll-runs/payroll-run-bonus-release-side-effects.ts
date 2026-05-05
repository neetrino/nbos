import { PrismaClient } from '@nbos/database';
import { refreshBonusEntryStatusAfterReleasesChange } from '../bonus/bonus-entry-status-sync';
import { syncProductBonusPoolForOrder } from '../bonus/product-bonus-pool-sync';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';

/**
 * Re-evaluates `BonusEntry.status` for every distinct entry touched by the given releases.
 */
export async function refreshBonusEntryStatusesForReleases(
  prisma: InstanceType<typeof PrismaClient>,
  releaseIds: string[],
): Promise<void> {
  if (releaseIds.length === 0) {
    return;
  }
  const rows = await prisma.bonusRelease.findMany({
    where: { id: { in: releaseIds } },
    select: { bonusEntryId: true },
  });
  const entryIds = [...new Set(rows.map((r) => r.bonusEntryId))];
  await Promise.all(entryIds.map((id) => refreshBonusEntryStatusAfterReleasesChange(prisma, id)));
}

/**
 * Keeps product bonus pools in sync and publishes wallet in-app hints after attach/detach.
 */
export async function syncProductBonusPoolsForBonusReleases(
  prisma: InstanceType<typeof PrismaClient>,
  releaseIds: string[],
  notify?: WalletInAppNotifySink,
): Promise<void> {
  if (releaseIds.length === 0) {
    return;
  }
  const rows = await prisma.bonusRelease.findMany({
    where: { id: { in: releaseIds } },
    select: { bonusEntry: { select: { orderId: true } } },
  });
  const orderIds = [...new Set(rows.map((r) => r.bonusEntry.orderId))];
  for (const orderId of orderIds) {
    await syncProductBonusPoolForOrder(prisma, orderId, notify);
  }
}
