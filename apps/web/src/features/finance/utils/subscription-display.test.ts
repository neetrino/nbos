import { describe, expect, it } from 'vitest';
import {
  formatSubscriptionGridRowMeta,
  getSubscriptionDisplayTitle,
} from './subscription-display';

describe('getSubscriptionDisplayTitle', () => {
  it('prefers the commercial name', () => {
    expect(getSubscriptionDisplayTitle({ name: 'Hosting', code: 'SUB-001' })).toBe('Hosting');
  });

  it('falls back to the code when the name is empty', () => {
    expect(getSubscriptionDisplayTitle({ name: '  ', code: 'SUB-001' })).toBe('SUB-001');
  });
});

describe('formatSubscriptionGridRowMeta', () => {
  it('puts billing day and monthly frequency on one line', () => {
    const meta = formatSubscriptionGridRowMeta({
      billingDay: 15,
      billingFrequency: 'MONTHLY',
      coverageMonthCount: 1,
    });
    expect(meta.text).toBe('15 · Monthly');
    expect(meta.title).toBe('Billing day 15 · Monthly');
  });

  it('uses the yearly label', () => {
    const meta = formatSubscriptionGridRowMeta({
      billingDay: 1,
      billingFrequency: 'YEARLY',
      coverageMonthCount: 12,
    });
    expect(meta.text).toBe('1 · Yearly');
  });

  it('shows custom coverage in months instead of Custom', () => {
    const meta = formatSubscriptionGridRowMeta({
      billingDay: 24,
      billingFrequency: 'CUSTOM',
      coverageMonthCount: 6,
    });
    expect(meta.text).toBe('24 · 6 mo');
    expect(meta.title).toBe('Billing day 24 · 6 mo');
  });
});
