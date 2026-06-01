import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { computeReceivableAmount } from './order-invoice-totals';

describe('computeReceivableAmount', () => {
  it('returns invoiced minus received floored at zero', () => {
    expect(computeReceivableAmount(new Decimal(1000), new Decimal(400)).toFixed(2)).toBe('600.00');
    expect(computeReceivableAmount(new Decimal(100), new Decimal(150)).toFixed(2)).toBe('0.00');
  });
});
