import { describe, expect, it } from 'vitest';
import { isOrderPaymentGateSatisfied } from './order-payment-gate';

describe('isOrderPaymentGateSatisfied', () => {
  it('passes when there is no order or order status', () => {
    expect(isOrderPaymentGateSatisfied(null)).toBe(true);
    expect(isOrderPaymentGateSatisfied(undefined)).toBe(true);
    expect(isOrderPaymentGateSatisfied({})).toBe(true);
  });

  it('requires FULLY_PAID or CLOSED for CLASSIC orders', () => {
    expect(isOrderPaymentGateSatisfied({ status: 'PARTIALLY_PAID', paymentType: 'CLASSIC' })).toBe(
      false,
    );
    expect(isOrderPaymentGateSatisfied({ status: 'FULLY_PAID', paymentType: 'CLASSIC' })).toBe(
      true,
    );
    expect(isOrderPaymentGateSatisfied({ status: 'CLOSED', paymentType: 'CLASSIC' })).toBe(true);
  });

  it('treats a missing paymentType as CLASSIC', () => {
    expect(isOrderPaymentGateSatisfied({ status: 'PARTIALLY_PAID' })).toBe(false);
    expect(isOrderPaymentGateSatisfied({ status: 'FULLY_PAID' })).toBe(true);
  });

  it('does not require full contract payment for SUBSCRIPTION orders', () => {
    expect(
      isOrderPaymentGateSatisfied({ status: 'PARTIALLY_PAID', paymentType: 'SUBSCRIPTION' }),
    ).toBe(true);
    expect(isOrderPaymentGateSatisfied({ status: 'ACTIVE', paymentType: 'SUBSCRIPTION' })).toBe(
      true,
    );
  });
});
