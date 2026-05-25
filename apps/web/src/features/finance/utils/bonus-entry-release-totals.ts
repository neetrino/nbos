import type { BonusReleaseStatus } from '@/lib/api/bonus';

const COUNTING_RELEASE_STATUSES: ReadonlySet<BonusReleaseStatus> = new Set([
  'APPROVED',
  'INCLUDED_IN_PAYROLL',
  'PAID',
]);

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export type BonusEntryReleaseTotals = {
  planned: number;
  released: number;
  paid: number;
  remaining: number;
  releasePercent: number;
};

export function computeBonusEntryReleaseTotals(
  plannedAmount: string,
  releases: ReadonlyArray<{ amount: string; status: BonusReleaseStatus }>,
): BonusEntryReleaseTotals {
  const planned = parseAmount(plannedAmount);
  let released = 0;
  let paid = 0;

  for (const row of releases) {
    const amount = parseAmount(row.amount);
    if (COUNTING_RELEASE_STATUSES.has(row.status)) {
      released += amount;
    }
    if (row.status === 'PAID') {
      paid += amount;
    }
  }

  const remaining = Math.max(0, planned - released);
  const releasePercent = planned > 0 ? Math.min(100, (released / planned) * 100) : 0;

  return { planned, released, paid, remaining, releasePercent };
}
