import { describe, expect, it } from 'vitest';
import {
  getInvoiceManualProductGateErrors,
  INVOICE_PRODUCT_GATE_FIELD,
  isInvoicePayerContextLocked,
  isUnsourcedInvoiceCreateMissingProduct,
} from './invoice-product-ownership-gate';

describe('isInvoicePayerContextLocked', () => {
  it('allows New and On Hold without an official request', () => {
    expect(isInvoicePayerContextLocked({ moneyStatus: 'NEW' })).toBe(false);
    expect(isInvoicePayerContextLocked({ moneyStatus: 'ON_HOLD' })).toBe(false);
    expect(isInvoicePayerContextLocked({ moneyStatus: 'CANCELLED' })).toBe(false);
  });

  it('locks collection, paid, and official-issued cards', () => {
    expect(isInvoicePayerContextLocked({ moneyStatus: 'AWAITING_PAYMENT' })).toBe(true);
    expect(isInvoicePayerContextLocked({ moneyStatus: 'OVERDUE' })).toBe(true);
    expect(isInvoicePayerContextLocked({ moneyStatus: 'PAID' })).toBe(true);
    expect(
      isInvoicePayerContextLocked({ moneyStatus: 'NEW', officialInvoiceRequestSent: true }),
    ).toBe(true);
  });
});

describe('getInvoiceManualProductGateErrors', () => {
  it('requires product on Manual collection statuses', () => {
    const errors = getInvoiceManualProductGateErrors({
      type: 'MANUAL',
      productId: null,
      targetMoneyStatus: 'AWAITING_PAYMENT',
    });
    expect(errors).toEqual([
      {
        field: INVOICE_PRODUCT_GATE_FIELD,
        message: 'Link a product on the invoice card before awaiting payment.',
      },
    ]);
  });

  it('allows Manual New without product', () => {
    expect(
      getInvoiceManualProductGateErrors({
        type: 'MANUAL',
        productId: null,
        targetMoneyStatus: 'NEW',
      }),
    ).toEqual([]);
  });

  it('does not gate sourced invoices', () => {
    expect(
      getInvoiceManualProductGateErrors({
        type: 'DEVELOPMENT',
        productId: null,
        targetMoneyStatus: 'AWAITING_PAYMENT',
      }),
    ).toEqual([]);
  });
});

describe('isUnsourcedInvoiceCreateMissingProduct', () => {
  it('requires product when there is no order, subscription, or client service', () => {
    expect(isUnsourcedInvoiceCreateMissingProduct({})).toBe(true);
    expect(isUnsourcedInvoiceCreateMissingProduct({ productId: '   ' })).toBe(true);
    expect(isUnsourcedInvoiceCreateMissingProduct({ productId: 'prod-1' })).toBe(false);
  });

  it('does not require explicit product when a source id is present', () => {
    expect(isUnsourcedInvoiceCreateMissingProduct({ orderId: 'ord-1' })).toBe(false);
    expect(isUnsourcedInvoiceCreateMissingProduct({ subscriptionId: 'sub-1' })).toBe(false);
    expect(isUnsourcedInvoiceCreateMissingProduct({ clientServiceRecordId: 'csr-1' })).toBe(false);
  });
});
