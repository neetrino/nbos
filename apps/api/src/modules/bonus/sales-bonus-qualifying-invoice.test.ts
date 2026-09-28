import { describe, expect, it } from 'vitest';
import {
  classifyClassicSalesInvoicePurpose,
  isExcludedFromSalesAccrual,
  isQualifyingProductInvoiceType,
} from './sales-bonus-qualifying-invoice';

describe('sales-bonus-qualifying-invoice', () => {
  it('treats development and extension invoices as qualifying product invoices', () => {
    expect(isQualifyingProductInvoiceType('DEVELOPMENT')).toBe(true);
    expect(isQualifyingProductInvoiceType('EXTENSION')).toBe(true);
    expect(classifyClassicSalesInvoicePurpose('DEVELOPMENT')).toBe('qualifying_product');
  });

  it('excludes domain and unrelated service invoices', () => {
    expect(isExcludedFromSalesAccrual('DOMAIN')).toBe(true);
    expect(isExcludedFromSalesAccrual('SERVICE')).toBe(true);
    expect(classifyClassicSalesInvoicePurpose('DOMAIN')).toBe('excluded');
    expect(classifyClassicSalesInvoicePurpose('SERVICE')).toBe('excluded');
  });

  it('holds when the purpose is ambiguous instead of guessing', () => {
    expect(classifyClassicSalesInvoicePurpose('MANUAL')).toBe('ambiguous');
    expect(classifyClassicSalesInvoicePurpose('SUBSCRIPTION')).toBe('ambiguous');
    expect(classifyClassicSalesInvoicePurpose(null)).toBe('ambiguous');
  });
});
