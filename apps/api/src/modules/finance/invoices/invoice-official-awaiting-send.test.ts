import { describe, expect, it } from 'vitest';
import {
  canAutoSendOfficialOnAwaiting,
  officialSendIdempotencyKey,
} from './invoice-official-awaiting-send';

const readyCompany = { name: 'InvestOn LLC', legalName: 'InvestOn LLC', taxId: '01234567' };

describe('canAutoSendOfficialOnAwaiting', () => {
  it('allows Tax Awaiting that is not yet sent', () => {
    expect(
      canAutoSendOfficialOnAwaiting({
        taxStatus: 'TAX',
        moneyStatus: 'AWAITING_PAYMENT',
        officialInvoiceRequestSent: false,
        companyId: 'c1',
        company: readyCompany,
      }),
    ).toBe(true);
  });

  it('rejects Free, Cancelled, already sent, and New', () => {
    const base = {
      taxStatus: 'TAX',
      moneyStatus: 'AWAITING_PAYMENT',
      officialInvoiceRequestSent: false,
      companyId: 'c1',
      company: readyCompany,
    };
    expect(canAutoSendOfficialOnAwaiting({ ...base, taxStatus: 'TAX_FREE' })).toBe(false);
    expect(canAutoSendOfficialOnAwaiting({ ...base, moneyStatus: 'CANCELLED' })).toBe(false);
    expect(canAutoSendOfficialOnAwaiting({ ...base, officialInvoiceRequestSent: true })).toBe(
      false,
    );
    expect(canAutoSendOfficialOnAwaiting({ ...base, moneyStatus: 'NEW' })).toBe(false);
  });
});

describe('officialSendIdempotencyKey', () => {
  it('uses initial until a cancel timestamp exists', () => {
    expect(officialSendIdempotencyKey('inv-1', null)).toBe('official_send:inv-1:initial');
    expect(officialSendIdempotencyKey('inv-1', new Date('2026-04-01T00:00:00.000Z'))).toBe(
      'official_send:inv-1:2026-04-01T00:00:00.000Z',
    );
  });
});
