import { describe, expect, it } from 'vitest';
import { didEnterAwaitingPayment } from './official-request-panel-constants';

describe('didEnterAwaitingPayment', () => {
  it('is true only on the transition into Awaiting Payment', () => {
    expect(didEnterAwaitingPayment('NEW', 'AWAITING_PAYMENT')).toBe(true);
    expect(didEnterAwaitingPayment('AWAITING_PAYMENT', 'AWAITING_PAYMENT')).toBe(false);
    expect(didEnterAwaitingPayment('AWAITING_PAYMENT', 'PAID')).toBe(false);
  });
});
