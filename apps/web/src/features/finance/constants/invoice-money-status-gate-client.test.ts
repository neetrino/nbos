import { describe, expect, it } from 'vitest';
import type { Invoice } from '@/lib/api/finance';
import {
  getLocalInvoiceMoneyStatusGateErrors,
  mapInvoiceMoneyStatusApiMessage,
} from './invoice-money-status-gate-client';

function baseInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    code: 'INV-1',
    amount: '1000',
    currency: 'AMD',
    type: 'STANDARD',
    moneyStatus: 'AWAITING_PAYMENT',
    taxStatus: 'TAX',
    projectId: 'p1',
    paymentCoverage: { paidAmount: 0, outstandingAmount: 1000 },
    payments: [],
    ...overrides,
  } as Invoice;
}

describe('invoice-money-status-gate-client', () => {
  it('blocks PAID when outstanding remains', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(baseInvoice(), 'PAID');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe('payments');
  });

  it('allows PAID when fully covered', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(
      baseInvoice({
        moneyStatus: 'AWAITING_PAYMENT',
        paymentCoverage: { paidAmount: 1000, outstandingAmount: 0 },
      }),
      'PAID',
    );
    expect(errors).toEqual([]);
  });

  it('blocks leaving PAID when invoice is fully paid', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(
      baseInvoice({
        moneyStatus: 'PAID',
        paymentCoverage: { paidAmount: 1000, outstandingAmount: 0 },
      }),
      'AWAITING_PAYMENT',
    );
    expect(errors[0]?.field).toBe('moneyStatus');
  });

  it('maps API guard copy to field highlights', () => {
    expect(
      mapInvoiceMoneyStatusApiMessage('Cannot mark invoice as paid before payments fully cover it'),
    ).toHaveLength(1);
  });
});
