import { describe, expect, it } from 'vitest';
import type { Deal } from '@/lib/api/deals';
import { resolveDealPresetProduct } from './deal-domain-invoice-product';

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    code: 'D-1',
    name: 'Acme',
    status: 'NEGOTIATION',
    type: 'PRODUCT',
    amount: 100,
    paymentType: 'PREPAY',
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
    productPlatform: null,
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
    seller: { id: 'emp-1', firstName: 'A', lastName: 'B' },
    orders: [],
    sourcePartner: null,
    sourceContact: null,
    marketingAccount: null,
    marketingActivity: null,
    ...overrides,
  };
}

describe('resolveDealPresetProduct', () => {
  it('prefills existingProductId without guessing another client product', () => {
    expect(
      resolveDealPresetProduct(
        deal({
          existingProductId: 'prod-1',
          existingProduct: { id: 'prod-1', name: 'Site', productType: 'COMPANY_WEBSITE' },
        }),
      ),
    ).toEqual({ id: 'prod-1', label: 'Site' });
  });

  it('uses a unique order productId', () => {
    expect(
      resolveDealPresetProduct(
        deal({
          orders: [
            {
              id: 'ord-1',
              code: 'O-1',
              status: 'ACTIVE',
              totalAmount: 100,
              projectId: 'prj-1',
              productId: 'prod-2',
              invoices: [],
            },
          ],
          handoff: {
            project: null,
            product: { id: 'prod-2', name: 'Shop', productType: 'ECOM' },
            subscriptions: [],
            maintenanceDeal: null,
          },
        }),
      ),
    ).toEqual({ id: 'prod-2', label: 'Shop' });
  });

  it('leaves the selector empty when products are ambiguous', () => {
    expect(
      resolveDealPresetProduct(
        deal({
          orders: [
            {
              id: 'ord-1',
              code: 'O-1',
              status: 'ACTIVE',
              totalAmount: 100,
              projectId: 'prj-1',
              productId: 'prod-a',
              invoices: [],
            },
            {
              id: 'ord-2',
              code: 'O-2',
              status: 'ACTIVE',
              totalAmount: 50,
              projectId: 'prj-1',
              productId: 'prod-b',
              invoices: [],
            },
          ],
        }),
      ),
    ).toBeNull();
  });
});
