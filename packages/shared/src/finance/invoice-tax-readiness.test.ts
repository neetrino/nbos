import { describe, expect, it } from 'vitest';
import {
  companyHasInvoiceRequisites,
  getInvoiceTaxMoneyStatusGateErrors,
  getOfficialInvoiceRequestSendErrors,
  resolveDepositInvoiceMoneyStatus,
  shouldCancelOfficialRequestOnCardCancel,
} from './invoice-tax-readiness';

const readyCompany = { name: 'InvestOn', legalName: 'InvestOn LLC', taxId: '01234567' };

describe('companyHasInvoiceRequisites', () => {
  it('requires both legal name and tax id', () => {
    expect(companyHasInvoiceRequisites(readyCompany)).toBe(true);
    expect(companyHasInvoiceRequisites({ name: 'LLC', taxId: '  ' })).toBe(false);
    expect(companyHasInvoiceRequisites(null)).toBe(false);
  });

  it('prefers legalName and falls back to display name', () => {
    expect(companyHasInvoiceRequisites({ legalName: 'ООО Сарибекян', taxId: '01234567' })).toBe(
      true,
    );
    expect(companyHasInvoiceRequisites({ name: 'Saribekyan', taxId: '01234567' })).toBe(true);
    expect(companyHasInvoiceRequisites({ name: '  ', legalName: '  ', taxId: '01234567' })).toBe(
      false,
    );
  });
});

describe('getOfficialInvoiceRequestSendErrors', () => {
  it('skips Tax-Free invoices', () => {
    expect(
      getOfficialInvoiceRequestSendErrors({ taxStatus: 'FREE', companyId: null, company: null }),
    ).toEqual([]);
  });

  it('requires company requisites for Tax', () => {
    const errors = getOfficialInvoiceRequestSendErrors({
      taxStatus: 'TAX',
      companyId: 'c1',
      company: { name: 'LLC', taxId: null },
    });
    expect(errors.map((error) => error.field)).toEqual(['companyTaxId']);
  });
});

describe('getInvoiceTaxMoneyStatusGateErrors', () => {
  it('allows New and On Hold without requisites', () => {
    expect(
      getInvoiceTaxMoneyStatusGateErrors({
        taxStatus: 'TAX',
        currentMoneyStatus: 'NEW',
        targetMoneyStatus: 'ON_HOLD',
        officialInvoiceRequestSent: false,
        company: null,
      }),
    ).toEqual([]);
  });

  it('blocks Awaiting Payment without requisites', () => {
    const errors = getInvoiceTaxMoneyStatusGateErrors({
      taxStatus: 'TAX',
      currentMoneyStatus: 'NEW',
      targetMoneyStatus: 'AWAITING_PAYMENT',
      officialInvoiceRequestSent: false,
      company: null,
    });
    expect(errors[0]?.field).toBe('company');
  });

  it('does not re-check requisites when already collecting', () => {
    expect(
      getInvoiceTaxMoneyStatusGateErrors({
        taxStatus: 'TAX',
        currentMoneyStatus: 'AWAITING_PAYMENT',
        targetMoneyStatus: 'OVERDUE',
        officialInvoiceRequestSent: false,
        company: null,
      }),
    ).toEqual([]);
  });

  it('blocks Paid until official request is sent', () => {
    const errors = getInvoiceTaxMoneyStatusGateErrors({
      taxStatus: 'TAX',
      currentMoneyStatus: 'AWAITING_PAYMENT',
      targetMoneyStatus: 'PAID',
      officialInvoiceRequestSent: false,
      company: readyCompany,
      companyId: 'c1',
    });
    expect(errors[0]?.field).toBe('officialInvoice');
  });

  it('allows Paid after official request is sent', () => {
    expect(
      getInvoiceTaxMoneyStatusGateErrors({
        taxStatus: 'TAX',
        currentMoneyStatus: 'AWAITING_PAYMENT',
        targetMoneyStatus: 'PAID',
        officialInvoiceRequestSent: true,
        company: readyCompany,
        companyId: 'c1',
      }),
    ).toEqual([]);
  });

  it('allows Tax-Free Paid without official request', () => {
    expect(
      getInvoiceTaxMoneyStatusGateErrors({
        taxStatus: 'FREE',
        currentMoneyStatus: 'NEW',
        targetMoneyStatus: 'PAID',
        officialInvoiceRequestSent: false,
        company: null,
      }),
    ).toEqual([]);
  });
});

describe('shouldCancelOfficialRequestOnCardCancel', () => {
  it('is true only for Tax with an active official request', () => {
    expect(
      shouldCancelOfficialRequestOnCardCancel({
        taxStatus: 'TAX',
        officialInvoiceRequestSent: true,
      }),
    ).toBe(true);
    expect(
      shouldCancelOfficialRequestOnCardCancel({
        taxStatus: 'TAX',
        officialInvoiceRequestSent: false,
      }),
    ).toBe(false);
  });
});

describe('resolveDepositInvoiceMoneyStatus', () => {
  it('keeps Tax deposits in New when requisites are missing', () => {
    expect(
      resolveDepositInvoiceMoneyStatus({ taxStatus: 'TAX', company: { name: 'LLC', taxId: null } }),
    ).toBe('NEW');
  });

  it('sends ready Tax and Tax-Free deposits to Awaiting Payment', () => {
    expect(resolveDepositInvoiceMoneyStatus({ taxStatus: 'TAX', company: readyCompany })).toBe(
      'AWAITING_PAYMENT',
    );
    expect(resolveDepositInvoiceMoneyStatus({ taxStatus: 'FREE', company: null })).toBe(
      'AWAITING_PAYMENT',
    );
  });
});
