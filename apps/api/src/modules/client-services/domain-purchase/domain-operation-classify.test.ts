import { describe, expect, it } from 'vitest';
import { classifyDomainOperation } from './domain-operation-classify';

describe('classifyDomainOperation', () => {
  it('treats a missing service as a new purchase', () => {
    expect(
      classifyDomainOperation({
        serviceId: null,
        domainId: null,
        productId: null,
        requestedProductId: 'prod-1',
        status: null,
        registrationConfirmedAt: null,
        invoices: [],
        renewalDate: null,
      }).kind,
    ).toBe('new_purchase');
  });

  it('continues an unfinished purchase', () => {
    expect(
      classifyDomainOperation({
        serviceId: 'svc-1',
        domainId: null,
        productId: 'prod-1',
        requestedProductId: 'prod-1',
        status: 'PENDING',
        registrationConfirmedAt: null,
        invoices: [],
        renewalDate: null,
      }).kind,
    ).toBe('continue_initial');
  });

  it('classifies a completed purchase as renewal', () => {
    expect(
      classifyDomainOperation({
        serviceId: 'svc-1',
        domainId: null,
        productId: 'prod-1',
        requestedProductId: 'prod-1',
        status: 'ACTIVE',
        registrationConfirmedAt: new Date('2026-01-01'),
        invoices: [],
        renewalDate: new Date('2027-01-01'),
      }).kind,
    ).toBe('renewal');
  });

  it('reuses an open invoice for the current cycle', () => {
    const result = classifyDomainOperation({
      serviceId: 'svc-1',
      domainId: null,
      productId: 'prod-1',
      requestedProductId: 'prod-1',
      status: 'PENDING',
      registrationConfirmedAt: null,
      invoices: [
        {
          id: 'inv-1',
          moneyStatus: 'AWAITING_PAYMENT',
          type: 'DOMAIN',
          createdAt: new Date(),
          dueDate: null,
        },
      ],
      renewalDate: null,
    });
    expect(result).toMatchObject({ kind: 'existing_invoice', invoiceId: 'inv-1' });
  });
});
