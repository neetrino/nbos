import { describe, it, expect } from 'vitest';
import {
  DeliveryResolutionEnum,
  ExtensionStatusEnum,
  ProductStatusEnum,
  SubscriptionTypeEnum,
} from '@nbos/database';
import { subscriptionBillingPausedForLateDelivery } from './billing-subscription-delivery-pause';

describe('subscriptionBillingPausedForLateDelivery', () => {
  const billingDate = new Date(2026, 4, 15);

  it('returns false for MAINTENANCE_ONLY even if product is late', () => {
    const paused = subscriptionBillingPausedForLateDelivery({
      subscriptionType: SubscriptionTypeEnum.MAINTENANCE_ONLY,
      products: [
        {
          deadline: new Date(2026, 3, 1),
          status: ProductStatusEnum.DEVELOPMENT,
          deliveryResolution: null,
          extensions: [],
        },
      ],
      billingDate,
    });
    expect(paused).toBe(false);
  });

  it('returns true for DEV_ONLY when product deadline passed and not delivered', () => {
    const paused = subscriptionBillingPausedForLateDelivery({
      subscriptionType: SubscriptionTypeEnum.DEV_ONLY,
      products: [
        {
          deadline: new Date(2026, 3, 10),
          status: ProductStatusEnum.QA,
          deliveryResolution: null,
          extensions: [],
        },
      ],
      billingDate,
    });
    expect(paused).toBe(true);
  });

  it('returns false on deadline day (not strictly after)', () => {
    const paused = subscriptionBillingPausedForLateDelivery({
      subscriptionType: SubscriptionTypeEnum.DEV_ONLY,
      products: [
        {
          deadline: new Date(2026, 4, 15),
          status: ProductStatusEnum.DEVELOPMENT,
          deliveryResolution: null,
          extensions: [],
        },
      ],
      billingDate: new Date(2026, 4, 15),
    });
    expect(paused).toBe(false);
  });

  it('returns false when product is DONE even after deadline', () => {
    const paused = subscriptionBillingPausedForLateDelivery({
      subscriptionType: SubscriptionTypeEnum.DEV_AND_MAINTENANCE,
      products: [
        {
          deadline: new Date(2026, 1, 1),
          status: ProductStatusEnum.DONE,
          deliveryResolution: DeliveryResolutionEnum.DONE,
          extensions: [],
        },
      ],
      billingDate,
    });
    expect(paused).toBe(false);
  });

  it('returns false when deadline is missing', () => {
    const paused = subscriptionBillingPausedForLateDelivery({
      subscriptionType: SubscriptionTypeEnum.DEV_ONLY,
      products: [
        {
          deadline: null,
          status: ProductStatusEnum.DEVELOPMENT,
          deliveryResolution: null,
          extensions: [],
        },
      ],
      billingDate,
    });
    expect(paused).toBe(false);
  });

  it('returns true when extension is late undelivered', () => {
    const paused = subscriptionBillingPausedForLateDelivery({
      subscriptionType: SubscriptionTypeEnum.DEV_ONLY,
      products: [
        {
          deadline: new Date(2027, 0, 1),
          status: ProductStatusEnum.DONE,
          deliveryResolution: DeliveryResolutionEnum.DONE,
          extensions: [
            {
              deadline: new Date(2026, 3, 1),
              status: ExtensionStatusEnum.DEVELOPMENT,
              deliveryResolution: null,
            },
          ],
        },
      ],
      billingDate,
    });
    expect(paused).toBe(true);
  });

  it('returns false when extension is CANCELLED', () => {
    const paused = subscriptionBillingPausedForLateDelivery({
      subscriptionType: SubscriptionTypeEnum.DEV_ONLY,
      products: [
        {
          deadline: new Date(2027, 0, 1),
          status: ProductStatusEnum.DONE,
          deliveryResolution: DeliveryResolutionEnum.DONE,
          extensions: [
            {
              deadline: new Date(2026, 3, 1),
              status: ExtensionStatusEnum.DEVELOPMENT,
              deliveryResolution: DeliveryResolutionEnum.CANCELLED,
            },
          ],
        },
      ],
      billingDate,
    });
    expect(paused).toBe(false);
  });
});
