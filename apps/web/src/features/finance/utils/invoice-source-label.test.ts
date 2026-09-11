import { describe, expect, it } from 'vitest';
import {
  getInvoiceSourceLabel,
  INVOICE_SOURCE_DEAL_LABEL,
  INVOICE_SOURCE_MANUAL_LABEL,
  INVOICE_SOURCE_ORDER_LABEL,
  INVOICE_SOURCE_SUBSCRIPTION_LABEL,
} from './invoice-source-label';

describe('getInvoiceSourceLabel', () => {
  it('prefers Deal over order, subscription, and client service', () => {
    expect(
      getInvoiceSourceLabel({
        orderId: 'ord-1',
        order: { deal: { id: 'deal-1' } },
        subscriptionId: 'sub-1',
        clientServiceRecordId: 'csr-1',
        clientServiceRecord: { type: 'DOMAIN' },
      }),
    ).toBe(INVOICE_SOURCE_DEAL_LABEL);
  });

  it('uses Order when the order has no deal', () => {
    expect(
      getInvoiceSourceLabel({
        orderId: 'ord-1',
        order: { deal: null },
        subscriptionId: 'sub-1',
      }),
    ).toBe(INVOICE_SOURCE_ORDER_LABEL);
  });

  it('uses Subscription when there is no order', () => {
    expect(getInvoiceSourceLabel({ subscriptionId: 'sub-1' })).toBe(
      INVOICE_SOURCE_SUBSCRIPTION_LABEL,
    );
  });

  it('uses client-service type, not Client service', () => {
    expect(
      getInvoiceSourceLabel({
        clientServiceRecordId: 'csr-1',
        clientServiceRecord: { type: 'DOMAIN' },
      }),
    ).toBe('Domain');
    expect(
      getInvoiceSourceLabel({
        clientServiceRecordId: 'csr-1',
        clientServiceRecord: { type: 'HOSTING' },
      }),
    ).toBe('Hosting');
    expect(
      getInvoiceSourceLabel({
        clientServiceRecordId: 'csr-1',
        clientServiceRecord: { type: 'LICENSE' },
      }),
    ).toBe('License');
  });

  it('falls back to invoice type then Service for client-service cards', () => {
    expect(
      getInvoiceSourceLabel({
        clientServiceRecordId: 'csr-1',
        type: 'DOMAIN',
      }),
    ).toBe('Domain');
    expect(getInvoiceSourceLabel({ clientServiceRecordId: 'csr-1' })).toBe('Service');
  });

  it('uses Manual when nothing is linked', () => {
    expect(getInvoiceSourceLabel({ type: 'DEVELOPMENT' })).toBe(INVOICE_SOURCE_MANUAL_LABEL);
  });
});
