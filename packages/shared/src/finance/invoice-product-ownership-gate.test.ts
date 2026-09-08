import { describe, expect, it } from 'vitest';
import {
  getInvoiceManualProductGateErrors,
  INVOICE_PRODUCT_GATE_FIELD,
} from './invoice-product-ownership-gate';

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
