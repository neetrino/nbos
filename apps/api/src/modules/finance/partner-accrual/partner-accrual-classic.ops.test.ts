import { describe, it, expect } from 'vitest';
import { Decimal } from '@nbos/database';
import {
  computeInboundPartnerAccrualAmount,
  isClassicInboundDeliveryComplete,
} from './partner-accrual-classic.ops';

describe('partner-accrual-classic.ops', () => {
  it('computeInboundPartnerAccrualAmount rounds half-up to 2 decimals', () => {
    const a = computeInboundPartnerAccrualAmount(new Decimal('1000.00'), new Decimal('12.345'));
    expect(a.toFixed(2)).toBe('123.45');
  });

  it('isClassicInboundDeliveryComplete is true for DONE product order', () => {
    expect(
      isClassicInboundDeliveryComplete({
        productId: 'p1',
        extensionId: null,
        product: { status: 'DONE' },
        extension: null,
      }),
    ).toBe(true);
  });

  it('isClassicInboundDeliveryComplete is true for DONE extension order', () => {
    expect(
      isClassicInboundDeliveryComplete({
        productId: null,
        extensionId: 'e1',
        product: null,
        extension: { status: 'DONE' },
      }),
    ).toBe(true);
  });

  it('isClassicInboundDeliveryComplete is false when carrier not DONE', () => {
    expect(
      isClassicInboundDeliveryComplete({
        productId: 'p1',
        extensionId: null,
        product: { status: 'TRANSFER' },
        extension: null,
      }),
    ).toBe(false);
  });
});
