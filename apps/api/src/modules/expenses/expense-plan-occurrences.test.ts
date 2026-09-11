import { describe, expect, it } from 'vitest';
import { collectPlanMonthIndexesInYear } from './expense-plan-occurrences';

describe('collectPlanMonthIndexesInYear', () => {
  it('returns empty set without anchor due date', () => {
    expect(collectPlanMonthIndexesInYear(2026, 'MONTHLY', null).size).toBe(0);
  });

  it('maps ONE_TIME to a single month in the target year', () => {
    const months = collectPlanMonthIndexesInYear(
      2026,
      'ONE_TIME',
      new Date('2026-05-15T00:00:00.000Z'),
    );
    expect([...months]).toEqual([4]);
  });

  it('enumerates monthly occurrences from next due forward', () => {
    const months = collectPlanMonthIndexesInYear(
      2026,
      'MONTHLY',
      new Date('2026-03-10T00:00:00.000Z'),
    );
    expect([...months].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('continues an earlier next due through the whole target year', () => {
    const months = collectPlanMonthIndexesInYear(
      2026,
      'MONTHLY',
      new Date('2025-11-10T00:00:00.000Z'),
    );
    expect(months.size).toBe(12);
    expect(months.has(0)).toBe(true);
    expect(months.has(11)).toBe(true);
  });

  it('keeps yearly on the next-due month only', () => {
    const months = collectPlanMonthIndexesInYear(
      2026,
      'YEARLY',
      new Date('2026-10-01T00:00:00.000Z'),
    );
    expect([...months]).toEqual([9]);
  });
});
