import { describe, expect, it } from 'vitest';
import {
  getInvoiceOrderCommentGateErrors,
  getInvoiceOrderCommentOptions,
  getOfficialInvoiceOrderCommentSendErrors,
  needsInvoiceOrderCommentGate,
} from './invoice-order-comment';

describe('invoice order comment', () => {
  it('lists comments by deal type', () => {
    expect(getInvoiceOrderCommentOptions('PRODUCT')).toEqual([
      'FIRST_PHASE',
      'INTERMEDIATE_PHASE',
      'FINAL_PHASE',
      'EXECUTION',
    ]);
    expect(getInvoiceOrderCommentOptions('MAINTENANCE')).toEqual(['MAINTENANCE']);
    expect(getInvoiceOrderCommentOptions('OUTSOURCE')).toContain('EXECUTION');
    expect(getInvoiceOrderCommentOptions(null)).toEqual(getInvoiceOrderCommentOptions('PRODUCT'));
  });

  it('does not gate New, On Hold, or Cancelled', () => {
    expect(
      needsInvoiceOrderCommentGate({
        orderId: 'ord-1',
        currentMoneyStatus: 'NEW',
        targetMoneyStatus: 'ON_HOLD',
      }),
    ).toBe(false);
  });

  it('lets existing Awaiting cards stay or move to Overdue without a comment', () => {
    expect(
      getInvoiceOrderCommentGateErrors({
        orderId: 'ord-1',
        orderComment: null,
        currentMoneyStatus: 'AWAITING_PAYMENT',
        targetMoneyStatus: 'OVERDUE',
      }),
    ).toEqual([]);
  });

  it('requires a comment to enter Awaiting or mark Paid', () => {
    expect(
      getInvoiceOrderCommentGateErrors({
        orderId: 'ord-1',
        orderComment: null,
        currentMoneyStatus: 'NEW',
        targetMoneyStatus: 'AWAITING_PAYMENT',
      })[0]?.field,
    ).toBe('orderComment');
    expect(
      getInvoiceOrderCommentGateErrors({
        orderId: 'ord-1',
        orderComment: null,
        currentMoneyStatus: 'AWAITING_PAYMENT',
        targetMoneyStatus: 'PAID',
      }),
    ).toHaveLength(1);
    expect(
      getInvoiceOrderCommentGateErrors({
        orderId: 'ord-1',
        orderComment: 'FIRST_PHASE',
        currentMoneyStatus: 'NEW',
        targetMoneyStatus: 'AWAITING_PAYMENT',
      }),
    ).toEqual([]);
  });

  it('requires a comment to send the official request for order invoices', () => {
    expect(
      getOfficialInvoiceOrderCommentSendErrors({ orderId: 'ord-1', orderComment: null })[0]?.field,
    ).toBe('orderComment');
    expect(
      getOfficialInvoiceOrderCommentSendErrors({
        orderId: 'ord-1',
        orderComment: 'EXECUTION',
      }),
    ).toEqual([]);
    expect(getOfficialInvoiceOrderCommentSendErrors({ orderId: null, orderComment: null })).toEqual(
      [],
    );
  });
});
