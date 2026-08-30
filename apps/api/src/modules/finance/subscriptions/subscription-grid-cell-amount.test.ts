import { describe, expect, it } from 'vitest';
import {
  invoiceMonthlyEquivalentAmount,
  resolveCoverageStep,
  subscriptionGridMonthKey,
} from './subscription-grid-cell-amount';

describe('subscriptionGridMonthKey', () => {
  it('formats a 0-based month index as YYYY-MM', () => {
    expect(subscriptionGridMonthKey(2026, 0)).toBe('2026-01');
    expect(subscriptionGridMonthKey(2026, 11)).toBe('2026-12');
  });
});

describe('invoiceMonthlyEquivalentAmount', () => {
  it('splits the invoice period sum across coverage months', () => {
    expect(invoiceMonthlyEquivalentAmount(120_000, 12)).toBe(10_000);
    expect(invoiceMonthlyEquivalentAmount(80_000, 2)).toBe(40_000);
    expect(invoiceMonthlyEquivalentAmount(80_000, 1)).toBe(80_000);
  });

  it('falls back to one month when coverage is invalid', () => {
    expect(invoiceMonthlyEquivalentAmount(80_000, null)).toBe(80_000);
    expect(resolveCoverageStep(0)).toBe(1);
    expect(resolveCoverageStep(6)).toBe(6);
  });
});
