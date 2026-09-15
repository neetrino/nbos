import { describe, expect, it } from 'vitest';
import { getInvoiceSourceCardChrome } from './invoice-source-card-chrome';

describe('getInvoiceSourceCardChrome', () => {
  it('gives deal, subscription, and client service distinct shells', () => {
    const deal = getInvoiceSourceCardChrome('deal');
    const subscription = getInvoiceSourceCardChrome('subscription');
    const clientService = getInvoiceSourceCardChrome('client_service');

    expect(deal.cardShellClassName).not.toBe(subscription.cardShellClassName);
    expect(subscription.cardShellClassName).not.toBe(clientService.cardShellClassName);
    expect(clientService.cardShellClassName).not.toBe(deal.cardShellClassName);
  });

  it('groups order and manual as the fourth chrome', () => {
    const order = getInvoiceSourceCardChrome('order');
    const manual = getInvoiceSourceCardChrome('manual');
    const deal = getInvoiceSourceCardChrome('deal');

    expect(order).toEqual(manual);
    expect(order.cardShellClassName).not.toBe(deal.cardShellClassName);
  });
});
