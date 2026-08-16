import { describe, expect, it } from 'vitest';
import {
  hasInboundDeliveryCarrier,
  shouldHoldSubscriptionAccrualUntilDelivery,
} from './partner-accrual-subscription.ops';

const openProduct = {
  productId: 'p1',
  extensionId: null,
  product: { status: 'DEVELOPMENT' },
  extension: null,
};

describe('partner-accrual-subscription.ops', () => {
  it('holds DEV_ONLY and DEV_AND_MAINTENANCE until delivery is complete', () => {
    expect(
      shouldHoldSubscriptionAccrualUntilDelivery({
        subscriptionType: 'DEV_ONLY',
        order: openProduct,
      }),
    ).toBe(true);
    expect(
      shouldHoldSubscriptionAccrualUntilDelivery({
        subscriptionType: 'DEV_AND_MAINTENANCE',
        order: openProduct,
      }),
    ).toBe(true);
  });

  it('does not hold MAINTENANCE_ONLY or PARTNER_SERVICE', () => {
    expect(
      shouldHoldSubscriptionAccrualUntilDelivery({
        subscriptionType: 'MAINTENANCE_ONLY',
        order: openProduct,
      }),
    ).toBe(false);
    expect(
      shouldHoldSubscriptionAccrualUntilDelivery({
        subscriptionType: 'PARTNER_SERVICE',
        order: openProduct,
      }),
    ).toBe(false);
  });

  it('does not hold when the delivery carrier is already DONE', () => {
    expect(
      shouldHoldSubscriptionAccrualUntilDelivery({
        subscriptionType: 'DEV_ONLY',
        order: { ...openProduct, product: { status: 'DONE' } },
      }),
    ).toBe(false);
  });

  it('does not hold when the order has no delivery carrier', () => {
    const orphan = {
      productId: null,
      extensionId: null,
      product: null,
      extension: null,
    };
    expect(hasInboundDeliveryCarrier(orphan)).toBe(false);
    expect(
      shouldHoldSubscriptionAccrualUntilDelivery({
        subscriptionType: 'DEV_ONLY',
        order: orphan,
      }),
    ).toBe(false);
  });
});
