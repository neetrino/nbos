import { PrismaClient, type BonusStatusEnum } from '@nbos/database';
import { BONUS_RELEASE_COUNTING_STATUSES } from './product-bonus-pool.constants';
import { decimalFrom } from './bonus-pool-decimal';

type StatusSyncDb = Pick<InstanceType<typeof PrismaClient>, 'bonusEntry' | 'bonusRelease'>;

const TERMINAL_ENTRY_STATUSES: BonusStatusEnum[] = ['PAID', 'CLAWBACK'];

const PROMOTABLE_ENTRY_STATUSES: BonusStatusEnum[] = [
  'INCOMING',
  'EARNED',
  'PENDING_ELIGIBILITY',
  'VESTED',
];

/**
 * Aligns `BonusEntry.status` with counting `BonusRelease` rows (NBOS board: Active ≈ in payroll pipeline).
 */
export async function refreshBonusEntryStatusAfterReleasesChange(
  db: StatusSyncDb,
  bonusEntryId: string,
): Promise<void> {
  const entry = await db.bonusEntry.findUnique({
    where: { id: bonusEntryId },
    select: { id: true, status: true, amount: true },
  });
  if (!entry) {
    return;
  }
  if (TERMINAL_ENTRY_STATUSES.includes(entry.status)) {
    return;
  }

  const paidAgg = await db.bonusRelease.aggregate({
    where: { bonusEntryId, status: 'PAID' },
    _sum: { amount: true },
  });
  const paidReleased = decimalFrom(paidAgg._sum.amount);
  const planned = decimalFrom(entry.amount);

  if (planned.gt(0) && paidReleased.gte(planned)) {
    await db.bonusEntry.update({
      where: { id: bonusEntryId },
      data: { status: 'PAID' },
    });
    return;
  }

  const agg = await db.bonusRelease.aggregate({
    where: {
      bonusEntryId,
      status: { in: [...BONUS_RELEASE_COUNTING_STATUSES] },
    },
    _sum: { amount: true },
  });
  const released = decimalFrom(agg._sum.amount);

  if (released.gt(0) && PROMOTABLE_ENTRY_STATUSES.includes(entry.status)) {
    await db.bonusEntry.update({
      where: { id: bonusEntryId },
      data: { status: 'ACTIVE' },
    });
    return;
  }

  if (entry.status === 'ACTIVE' && released.isZero()) {
    await db.bonusEntry.update({
      where: { id: bonusEntryId },
      data: { status: 'INCOMING' },
    });
  }
}

export async function syncBonusEntryStatusesForOrder(
  db: StatusSyncDb,
  orderId: string,
): Promise<void> {
  const entries = await db.bonusEntry.findMany({
    where: { orderId },
    select: { id: true },
  });
  for (const row of entries) {
    await refreshBonusEntryStatusAfterReleasesChange(db, row.id);
  }
}
