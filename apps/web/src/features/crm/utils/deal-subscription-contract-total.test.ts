import { describe, expect, it } from 'vitest';
import { deriveDealSubscriptionContractTotal } from './deal-subscription-contract-total';

describe('deriveDealSubscriptionContractTotal', () => {
  it('multiplies period amount by term months', () => {
    expect(deriveDealSubscriptionContractTotal(1_000_000, 6)).toBe(6_000_000);
    expect(deriveDealSubscriptionContractTotal(100, 12)).toBe(1200);
  });

  it('returns null when inputs are missing or invalid', () => {
    expect(deriveDealSubscriptionContractTotal(null, 6)).toBeNull();
    expect(deriveDealSubscriptionContractTotal(100, null)).toBeNull();
    expect(deriveDealSubscriptionContractTotal(100, 0)).toBeNull();
  });
});
