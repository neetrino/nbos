import { describe, expect, it } from 'vitest';
import { dealSubscriptionTermFieldVisible } from './deal-subscription-term';

describe('dealSubscriptionTermFieldVisible', () => {
  it('shows the term for product subscriptions', () => {
    expect(dealSubscriptionTermFieldVisible('PRODUCT', 'SUBSCRIPTION')).toBe(true);
    expect(dealSubscriptionTermFieldVisible('EXTENSION', 'SUBSCRIPTION')).toBe(true);
  });

  it('hides the term for maintenance even when payment is subscription', () => {
    expect(dealSubscriptionTermFieldVisible('MAINTENANCE', 'SUBSCRIPTION')).toBe(false);
  });

  it('hides the term for classic payment', () => {
    expect(dealSubscriptionTermFieldVisible('PRODUCT', 'CLASSIC')).toBe(false);
    expect(dealSubscriptionTermFieldVisible('MAINTENANCE', 'CLASSIC')).toBe(false);
  });
});
