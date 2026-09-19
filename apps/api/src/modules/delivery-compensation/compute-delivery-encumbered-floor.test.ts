import { describe, expect, it } from 'vitest';
import { computeDeliveryEncumberedFloor } from './compute-delivery-encumbered-floor';

describe('computeDeliveryEncumberedFloor', () => {
  it('counts a release once and keeps the higher retained accepted amount', () => {
    expect(computeDeliveryEncumberedFloor([{ amount: '40.00', status: 'PAID' }], '55.00')).toBe(
      '55.00',
    );
    expect(
      computeDeliveryEncumberedFloor(
        [
          { amount: '40.00', status: 'PAID' },
          { amount: '10.00', status: 'CANCELLED' },
        ],
        '0',
      ),
    ).toBe('40.00');
  });

  it('is zero when nothing is accepted or released', () => {
    expect(computeDeliveryEncumberedFloor([], '0')).toBe('0.00');
  });
});
