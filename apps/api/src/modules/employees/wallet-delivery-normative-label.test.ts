import { describe, expect, it } from 'vitest';
import { DELIVERY_BONUS_SOURCE_V2 } from '@nbos/shared';
import { walletDeliveryLabel } from './wallet-delivery-normative-label';

describe('walletDeliveryLabel', () => {
  it('labels a V2 delivery accrual with its role only', () => {
    expect(
      walletDeliveryLabel({
        deliverySource: DELIVERY_BONUS_SOURCE_V2,
        deliveryRoleKey: 'QA',
      }),
    ).toEqual({ deliveryRoleKey: 'QA' });
  });

  it('leaves legacy and sales rows unlabelled', () => {
    expect(walletDeliveryLabel({ deliverySource: null, deliveryRoleKey: 'BACKEND' })).toEqual({
      deliveryRoleKey: null,
    });
  });

  it('never returns units or rates to the employee API', () => {
    const label = walletDeliveryLabel({
      deliverySource: DELIVERY_BONUS_SOURCE_V2,
      deliveryRoleKey: 'PM',
    });
    expect(Object.keys(label)).toEqual(['deliveryRoleKey']);
  });
});
