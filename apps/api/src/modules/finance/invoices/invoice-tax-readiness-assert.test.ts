import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertInvoiceTaxMoneyStatusGate,
  assertOfficialInvoiceRequestSend,
} from './invoice-tax-readiness-assert';

describe('assertInvoiceTaxMoneyStatusGate', () => {
  it('throws structured stage-gate errors for Tax Awaiting without company', () => {
    try {
      assertInvoiceTaxMoneyStatusGate({
        taxStatus: 'TAX',
        currentMoneyStatus: 'NEW',
        targetMoneyStatus: 'AWAITING_PAYMENT',
        officialInvoiceRequestSent: false,
        company: null,
      });
      throw new Error('expected gate to throw');
    } catch (caught) {
      expect(caught).toBeInstanceOf(BadRequestException);
      const body = (caught as BadRequestException).getResponse() as { code?: string };
      expect(body.code).toBe('STAGE_GATE_VALIDATION');
    }
  });

  it('passes Tax-Free Paid', () => {
    expect(() =>
      assertInvoiceTaxMoneyStatusGate({
        taxStatus: 'FREE',
        currentMoneyStatus: 'NEW',
        targetMoneyStatus: 'PAID',
        officialInvoiceRequestSent: false,
        company: null,
      }),
    ).not.toThrow();
  });
});

describe('assertOfficialInvoiceRequestSend', () => {
  it('throws when Tax company tax id is missing', () => {
    expect(() =>
      assertOfficialInvoiceRequestSend({
        taxStatus: 'TAX',
        companyId: 'c1',
        company: { name: 'LLC', taxId: null },
      }),
    ).toThrow(BadRequestException);
  });
});
