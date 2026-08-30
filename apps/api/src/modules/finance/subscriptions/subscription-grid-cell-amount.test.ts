import { describe, expect, it } from 'vitest';
import {
  cadenceChargeDisplayAmount,
  invoiceChargeDisplayAmount,
  isCadenceChargeMonth,
  resolveCoverageStep,
  subscriptionGridMonthKey,
} from './subscription-grid-cell-amount';

describe('subscriptionGridMonthKey', () => {
  it('formats a 0-based month index as YYYY-MM', () => {
    expect(subscriptionGridMonthKey(2026, 0)).toBe('2026-01');
    expect(subscriptionGridMonthKey(2026, 11)).toBe('2026-12');
  });
});

describe('isCadenceChargeMonth', () => {
  it('marks the billing-start month and every coverage step', () => {
    const start = new Date(2026, 0, 1);
    expect(isCadenceChargeMonth(start, 3, '2026-01')).toBe(true);
    expect(isCadenceChargeMonth(start, 3, '2026-04')).toBe(true);
    expect(isCadenceChargeMonth(start, 3, '2026-02')).toBe(false);
    expect(isCadenceChargeMonth(start, 12, '2027-01')).toBe(true);
    expect(isCadenceChargeMonth(start, 12, '2026-07')).toBe(false);
  });
});

describe('cadenceChargeDisplayAmount', () => {
  it('returns the period amount only on charge months', () => {
    const start = new Date(2026, 0, 15);
    expect(cadenceChargeDisplayAmount(100000, start, 12, '2026-01')).toBe(100000);
    expect(cadenceChargeDisplayAmount(100000, start, 12, '2026-02')).toBeNull();
  });
});

describe('invoiceChargeDisplayAmount', () => {
  it('returns the invoice amount only on coverage start', () => {
    expect(invoiceChargeDisplayAmount('2026-01', 40000, '2026-01')).toBe(40000);
    expect(invoiceChargeDisplayAmount('2026-01', 40000, '2026-02')).toBeNull();
  });
});

describe('resolveCoverageStep', () => {
  it('falls back to one month when coverage is invalid', () => {
    expect(resolveCoverageStep(6)).toBe(6);
    expect(resolveCoverageStep(0)).toBe(1);
    expect(resolveCoverageStep(null)).toBe(1);
  });
});
