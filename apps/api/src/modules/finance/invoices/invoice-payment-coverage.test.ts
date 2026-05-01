import { describe, expect, it } from 'vitest';
import { buildInvoicePaymentCoverage } from './invoice-payment-coverage';

describe('buildInvoicePaymentCoverage', () => {
  it('derives paid and outstanding amounts from invoice payments', () => {
    const coverage = buildInvoicePaymentCoverage({
      amount: 100000,
      payments: [{ amount: 25000 }, { amount: 50000 }],
      _count: { payments: 2 },
    });

    expect(coverage).toEqual({
      paidAmount: 75000,
      outstandingAmount: 25000,
      paymentCount: 2,
      isFullyPaid: false,
    });
  });

  it('marks invoice as fully paid without negative outstanding amount', () => {
    const coverage = buildInvoicePaymentCoverage({
      amount: '100000',
      payments: [{ amount: '100000' }],
    });

    expect(coverage).toEqual({
      paidAmount: 100000,
      outstandingAmount: 0,
      paymentCount: 1,
      isFullyPaid: true,
    });
  });
});
