import { describe, it, expect } from 'vitest';
import {
  expandCoverageMonthKeys,
  financeCalendarMonthKey,
  isValidCoverageMonthKey,
  lastDateOfCoverageMonth,
  shiftCoverageMonthKey,
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

  it('shiftCoverageMonthKey moves forward and backward across years', () => {
    expect(shiftCoverageMonthKey('2026-01', -1)).toBe('2025-12');
    expect(shiftCoverageMonthKey('2025-12', 1)).toBe('2026-01');
  });

  it('lastDateOfCoverageMonth returns the last local instant of the month', () => {
    expect(lastDateOfCoverageMonth('2026-02')).toEqual(new Date(2026, 2, 0, 23, 59, 59, 999));
  });
});
