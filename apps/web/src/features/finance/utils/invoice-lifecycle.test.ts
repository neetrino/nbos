import { describe, expect, it } from 'vitest';
import type { Invoice } from '@/lib/api/finance';
import { invoiceLifecycleAction } from './invoice-lifecycle';

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    code: 'INV-1',
    type: 'DEAL',
    amount: '100000',
    currency: 'AMD',
    moneyStatus: 'NEW',
    taxStatus: 'TAX',
    dueDate: null,
    createdAt: '',
    updatedAt: '',
    _count: { payments: 0 },
    ...overrides,
  } as Invoice;
}

describe('invoiceLifecycleAction', () => {
  it('lets only the platform owner hard-delete a NEW invoice without payments', () => {
    expect(invoiceLifecycleAction(invoice(), true)).toBe('delete');
    expect(invoiceLifecycleAction(invoice(), false)).toBe('cancel');
  });

  it('never deletes an invoice that already has payments', () => {
    const withPayment = invoice({ _count: { payments: 1 } });
    expect(invoiceLifecycleAction(withPayment, true)).toBe('cancel');
    expect(invoiceLifecycleAction(withPayment, false)).toBe('cancel');
  });

  it('cancels non-draft invoices for any editor', () => {
    expect(invoiceLifecycleAction(invoice({ moneyStatus: 'AWAITING_PAYMENT' }), true)).toBe(
      'cancel',
    );
    expect(invoiceLifecycleAction(invoice({ moneyStatus: 'AWAITING_PAYMENT' }), false)).toBe(
      'cancel',
    );
  });

  it('hides lifecycle actions for paid and cancelled invoices', () => {
    expect(invoiceLifecycleAction(invoice({ moneyStatus: 'PAID' }), true)).toBeNull();
    expect(invoiceLifecycleAction(invoice({ moneyStatus: 'CANCELLED' }), false)).toBeNull();
  });
});
