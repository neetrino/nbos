import { describe, expect, it } from 'vitest';
import { allocateShares, assertShareSumMatchesTotal, percentOfAmount } from './allocate-shares';

describe('allocateShares', () => {
  it('splits 2-decimal percents without rounding 33.33 down to 33', () => {
    const allocated = allocateShares('100.00', [
      { key: 'a', percent: '33.33' },
      { key: 'b', percent: '33.33' },
      { key: 'c', percent: '33.34' },
    ]);
    const byKey = Object.fromEntries(allocated.map((row) => [row.key, row.amount]));
    expect(byKey.a).toBe('33.33');
    expect(byKey.b).toBe('33.33');
    expect(assertShareSumMatchesTotal('100.00', allocated)).toBe(true);
  });
});

describe('percentOfAmount', () => {
  it('returns the share of a component amount at percent scale', () => {
    expect(percentOfAmount('25000.00', '100000.00')).toBe('25.00');
  });
});
