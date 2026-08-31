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
    companyId: 'c1',
    officialInvoiceRequestSent: true,
    company: { id: 'c1', name: 'InvestOn LLC', taxId: '01234567' },
    paymentCoverage: {
      paidAmount: 0,
      outstandingAmount: 1000,
      paymentCount: 0,
      isFullyPaid: false,
    },
    payments: [],
    ...overrides,
  } as Invoice;
}

describe('invoice-money-status-gate-client', () => {
  it('allows PAID when outstanding remains (API settles via Payment)', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(baseInvoice(), 'PAID');
    expect(errors).toEqual([]);
  });

  it('requires company and project for manual invoices entering awaiting payment', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(
      baseInvoice({
        type: 'MANUAL',
        taxStatus: 'FREE',
        companyId: null,
        company: null,
        projectId: null,
        moneyStatus: 'NEW',
      }),
      'AWAITING_PAYMENT',
    );
    expect(errors.map((error) => error.field)).toEqual(['company', 'project']);
  });

  it('allows PAID when fully covered', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(
      baseInvoice({
        moneyStatus: 'AWAITING_PAYMENT',
        paymentCoverage: {
          paidAmount: 1000,
          outstandingAmount: 0,
          paymentCount: 1,
          isFullyPaid: true,
        },
      }),
      'PAID',
    );
    expect(errors).toEqual([]);
  });

  it('blocks leaving PAID when invoice is fully paid', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(
      baseInvoice({
        moneyStatus: 'PAID',
        paymentCoverage: {
          paidAmount: 1000,
          outstandingAmount: 0,
          paymentCount: 1,
          isFullyPaid: true,
        },
      }),
      'AWAITING_PAYMENT',
    );
    expect(errors[0]?.field).toBe('moneyStatus');
  });

  it('blocks Tax Awaiting Payment without company tax id', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(
      baseInvoice({
        moneyStatus: 'NEW',
        officialInvoiceRequestSent: false,
        company: { id: 'c1', name: 'InvestOn LLC', taxId: null },
      }),
      'AWAITING_PAYMENT',
    );
    expect(errors.map((error) => error.field)).toEqual(['companyTaxId']);
  });

  it('blocks order invoices entering Awaiting without an accountant note', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(
      baseInvoice({
        orderId: 'ord-1',
        orderComment: null,
        moneyStatus: 'NEW',
        taxStatus: 'TAX_FREE',
      }),
      'AWAITING_PAYMENT',
    );
    expect(errors[0]?.field).toBe('orderComment');
  });

  it('blocks Tax Paid when official request is not sent', () => {
    const errors = getLocalInvoiceMoneyStatusGateErrors(
      baseInvoice({ officialInvoiceRequestSent: false }),
      'PAID',
    );
    expect(errors[0]?.field).toBe('officialInvoice');
  });

  it('maps API guard copy to field highlights', () => {
    expect(
      mapInvoiceMoneyStatusApiMessage('Fully paid invoices must stay in PAID money status'),
    ).toHaveLength(1);
  });
});
