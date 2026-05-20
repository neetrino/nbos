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

  it('enumerates monthly occurrences across the year', () => {
    const months = collectPlanMonthIndexesInYear(
      2026,
      'MONTHLY',
      new Date('2026-03-10T00:00:00.000Z'),
    );
    expect(months.size).toBe(12);
    expect(months.has(0)).toBe(true);
    expect(months.has(11)).toBe(true);
  });
});
