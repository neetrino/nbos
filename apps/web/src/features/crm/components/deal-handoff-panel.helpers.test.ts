import { describe, expect, it } from 'vitest';
import type { Deal } from '@/lib/api/deals';
import { shouldShowHandoffPanel } from './deal-handoff-panel.helpers';

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    code: 'D-1',
    name: 'Acme',
    status: 'GET_ANSWER',
    type: 'PRODUCT',
    amount: 1000,
    paymentType: 'CLASSIC',
    projectId: null,
    source: null,
    sourceDetail: null,
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: null,
    marketingActivityId: null,
    notes: null,
    productCategory: null,
    productType: null,
    pmId: null,
    deadline: null,
    pm: null,
    existingProductId: null,
    existingProduct: null,
    offerSentAt: null,
    offerLink: null,
    offerFileUrl: null,
    offerScreenshotUrl: null,
    contractSignedAt: null,
    contractFileUrl: null,
    maintenanceStartAt: null,
    outsourceGoesToDelivery: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lead: null,
    contact: null,
    seller: { id: 'emp-1', firstName: 'Ada', lastName: 'Lovelace' },
    sourcePartner: null,
    sourceContact: null,
    marketingAccount: null,
    marketingActivity: null,
    orders: [],
    ...overrides,
  };
}

describe('shouldShowHandoffPanel', () => {
  it('does not throw when orders is missing', () => {
    const withoutOrders = deal();
    delete (withoutOrders as { orders?: Deal['orders'] }).orders;

    expect(() => shouldShowHandoffPanel(withoutOrders)).not.toThrow();
    expect(shouldShowHandoffPanel(withoutOrders)).toBe(true);
  });

  it('does not throw when handoff.subscriptions is missing', () => {
    const withoutSubscriptions = deal({
      status: 'QUALIFICATION',
      type: 'MAINTENANCE',
      handoff: {
        project: null,
        product: null,
        maintenanceDeal: null,
      } as Deal['handoff'],
    });

    expect(() => shouldShowHandoffPanel(withoutSubscriptions)).not.toThrow();
    expect(shouldShowHandoffPanel(withoutSubscriptions)).toBe(false);
  });

  it('shows the panel for an early-start order', () => {
    expect(
      shouldShowHandoffPanel(
        deal({
          status: 'QUALIFICATION',
          type: 'MAINTENANCE',
          orders: [
            {
              id: 'ord-1',
              code: 'O-1',
              status: 'OPEN',
              totalAmount: 1000,
              projectId: 'proj-1',
              deliveryStartMode: 'EARLY_START',
              invoices: [],
            },
          ],
        }),
      ),
    ).toBe(true);
  });
});
