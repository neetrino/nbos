import { describe, expect, it } from 'vitest';
import { computeBonusEntryReleaseTotals } from './bonus-entry-release-totals';

describe('computeBonusEntryReleaseTotals', () => {
  it('sums counting releases and paid separately', () => {
    const totals = computeBonusEntryReleaseTotals('100000', [
      { amount: '30000', status: 'APPROVED' },
      { amount: '20000', status: 'PAID' },
      { amount: '5000', status: 'DRAFT' },
    ]);
    expect(totals.planned).toBe(100000);
    expect(totals.released).toBe(50000);
    expect(totals.paid).toBe(20000);
    expect(totals.remaining).toBe(50000);
    expect(totals.releasePercent).toBe(50);
  });
});
