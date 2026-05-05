import { PrismaClient } from '@nbos/database';
import { refreshBonusEntryStatusAfterReleasesChange } from '../bonus/bonus-entry-status-sync';

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
