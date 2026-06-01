import { describe, expect, it } from 'vitest';

import { earnedSalesPeriodForPayoutMonth } from './earned-sales-kpi-period';

describe('earnedSalesPeriodForPayoutMonth', () => {
  it('returns prior calendar month', () => {
    expect(earnedSalesPeriodForPayoutMonth('2026-04')).toBe('2026-03');
    expect(earnedSalesPeriodForPayoutMonth('2026-01')).toBe('2025-12');
  });
});
