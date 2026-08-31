import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { parseUpdateInvoiceGeneralInput } from './invoice-general-update';

describe('parseUpdateInvoiceGeneralInput', () => {
  it('accepts amount and taxStatus', () => {
    expect(parseUpdateInvoiceGeneralInput({ amount: 1000, taxStatus: 'TAX_FREE' })).toEqual({
      amount: 1000,
      taxStatus: 'TAX_FREE',
    });
  });

  it('rejects non-positive amount', () => {
    expect(() => parseUpdateInvoiceGeneralInput({ amount: 0 })).toThrow(BadRequestException);
  });

  it('rejects unknown taxStatus', () => {
    expect(() => parseUpdateInvoiceGeneralInput({ taxStatus: 'VAT' })).toThrow(BadRequestException);
  });

  it('rejects empty patch', () => {
    expect(() => parseUpdateInvoiceGeneralInput({})).toThrow(BadRequestException);
  });

  it('accepts a deal/order accountant note', () => {
    expect(parseUpdateInvoiceGeneralInput({ orderComment: 'FIRST_PHASE' })).toEqual({
      orderComment: 'FIRST_PHASE',
    });
  });

  it('rejects an unknown accountant note', () => {
    expect(() => parseUpdateInvoiceGeneralInput({ orderComment: 'OTHER' })).toThrow(
      BadRequestException,
    );
  });
});
