import { describe, it, expect } from 'vitest';
import {
  expandCoverageMonthKeys,
  financeCalendarMonthKey,
  isValidCoverageMonthKey,
} from './subscription-coverage-month';

describe('subscription-coverage-month', () => {
  it('financeCalendarMonthKey uses local calendar month', () => {
    expect(financeCalendarMonthKey(new Date(2026, 2, 15))).toBe('2026-03');
  });

  it('expandCoverageMonthKeys spans year boundary', () => {
    expect(expandCoverageMonthKeys('2025-11', 4)).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('isValidCoverageMonthKey rejects invalid strings', () => {
    expect(isValidCoverageMonthKey('2026-01')).toBe(true);
    expect(isValidCoverageMonthKey('2026-13')).toBe(false);
    expect(isValidCoverageMonthKey('2026-1')).toBe(false);
  });
});
