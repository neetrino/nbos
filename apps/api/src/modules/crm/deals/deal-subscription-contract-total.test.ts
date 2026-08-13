import { describe, expect, it } from 'vitest';
import { deriveSubscriptionContractTotal } from './deal-subscription-contract-total';

describe('deriveSubscriptionContractTotal', () => {
  it('multiplies period price by term (1_000_000 × 6)', () => {
    expect(deriveSubscriptionContractTotal(1_000_000, 6)).toBe(6_000_000);
  });

  it('multiplies fractional period amounts without residual (16_666.67 × 6)', () => {
    expect(deriveSubscriptionContractTotal(16_666.67, 6)).toBe(100_000.02);
  });

  it('returns the period amount for a one-month term', () => {
    expect(deriveSubscriptionContractTotal(250_000, 1)).toBe(250_000);
  });
});
