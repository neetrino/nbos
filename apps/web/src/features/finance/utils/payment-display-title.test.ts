import { describe, expect, it } from 'vitest';
import { getPaymentDisplayTitle } from './payment-display-title';
import type { Payment } from '@/lib/api/finance';

function payment(partial: Partial<Payment> & Pick<Payment, 'id' | 'amount'>): Payment {
  return {
    invoiceId: 'inv-1',
    paymentDate: '2026-09-01',
    paymentMethod: null,
    confirmedBy: null,
    notes: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    ...partial,
  };
}

describe('getPaymentDisplayTitle', () => {
  it('uses amount and invoice code when present', () => {
    const title = getPaymentDisplayTitle(
      payment({
        id: 'pay-1',
        amount: '150000',
        invoice: { id: 'inv-1', code: 'INV-42', projectId: 'p1' },
      }),
    );
    expect(title).toContain('INV-42');
    expect(title).toMatch(/150/);
  });

  it('falls back to amount only', () => {
    const title = getPaymentDisplayTitle(payment({ id: 'pay-2', amount: '1000' }));
    expect(title).not.toContain('·');
    expect(title).toMatch(/1/);
  });
});
