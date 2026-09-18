import { describe, expect, it } from 'vitest';
import { paymentMethodLabel } from './payment-method-label';

describe('paymentMethodLabel', () => {
  it('maps known method codes', () => {
    expect(paymentMethodLabel('TRANSACTION')).toBe('Transaction');
    expect(paymentMethodLabel('CASH')).toBe('Cash');
  });

  it('returns raw value for unknown codes', () => {
    expect(paymentMethodLabel('CRYPTO')).toBe('CRYPTO');
  });

  it('returns null for empty', () => {
    expect(paymentMethodLabel(null)).toBeNull();
    expect(paymentMethodLabel('')).toBeNull();
    expect(paymentMethodLabel('   ')).toBeNull();
  });
});
