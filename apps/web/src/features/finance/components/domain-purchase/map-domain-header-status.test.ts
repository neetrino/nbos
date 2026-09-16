import { describe, expect, it } from 'vitest';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import { productDomainHeaderKind } from './map-domain-header-status';

function service(overrides: Partial<ClientServiceRecord>): ClientServiceRecord {
  return {
    id: 'svc-1',
    projectId: 'p1',
    productId: 'prod-1',
    type: 'DOMAIN',
    name: 'example.am',
    provider: null,
    providerAccountId: null,
    status: 'PENDING',
    billingModel: 'WE_PAY',
    pricingModel: 'FIXED',
    frequency: 'YEARLY',
    ourCost: null,
    clientCharge: null,
    taxStatus: 'TAX',
    notificationsEnabled: true,
    reminderLanguage: 'HY',
    startDate: null,
    renewalDate: null,
    notes: null,
    createdAt: '',
    updatedAt: '',
    project: { id: 'p1', code: 'P1', name: 'Proj' },
    product: { id: 'prod-1', name: 'Site' },
    providerAccount: null,
    _count: { invoices: 0, expensePlans: 0, expenses: 0 },
    ...overrides,
  };
}

describe('productDomainHeaderKind', () => {
  it('keeps DNS distinct from connected', () => {
    expect(
      productDomainHeaderKind([
        service({ connectionMode: 'CLIENT_DNS', dnsInstructions: 'A record' }),
      ]),
    ).toBe('client_dns');
  });

  it('uses purchased when registered but not verified', () => {
    expect(
      productDomainHeaderKind([
        service({
          connectionMode: 'PURCHASE',
          providerAccountId: 'c1',
          registrationConfirmedAt: '2026-09-01',
        }),
      ]),
    ).toBe('purchased');
  });
});
