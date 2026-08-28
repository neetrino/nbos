import { describe, expect, it } from 'vitest';
import { resolveBillingInvoiceMoneyStatus } from './billing-subscription-invoice-status';

describe('resolveBillingInvoiceMoneyStatus', () => {
  it('puts day-1 Free cards in Awaiting', () => {
    expect(
      resolveBillingInvoiceMoneyStatus({
        billingDay: 1,
        taxStatus: 'TAX_FREE',
        company: null,
      }),
    ).toBe('AWAITING_PAYMENT');
  });

  it('keeps day-1 Tax without requisites in New', () => {
    expect(
      resolveBillingInvoiceMoneyStatus({
        billingDay: 1,
        taxStatus: 'TAX',
        company: { name: 'LLC', taxId: null },
      }),
    ).toBe('NEW');
  });

  it('puts day-1 Tax with requisites in Awaiting', () => {
    expect(
      resolveBillingInvoiceMoneyStatus({
        billingDay: 1,
        taxStatus: 'TAX',
        company: { name: 'LLC', taxId: '01234567' },
      }),
    ).toBe('AWAITING_PAYMENT');
  });

  it('keeps days 2–31 in New', () => {
    expect(
      resolveBillingInvoiceMoneyStatus({
        billingDay: 15,
        taxStatus: 'TAX_FREE',
        company: null,
      }),
    ).toBe('NEW');
  });
});
