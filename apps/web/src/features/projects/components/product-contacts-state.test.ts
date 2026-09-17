import { describe, expect, it } from 'vitest';
import type { FullProduct } from '@/lib/api/products';
import {
  buildProductContactsPatch,
  productContactsDraftFromProduct,
} from './product-contacts-state';

function product(overrides: Partial<FullProduct> = {}): FullProduct {
  return {
    id: 'prod-1',
    projectId: 'proj-1',
    name: 'Website',
    productCategory: 'CODE',
    productType: 'COMPANY_WEBSITE',
    status: 'DEVELOPMENT',
    pmId: null,
    deadline: null,
    description: null,
    checklistTemplateId: null,
    clientAcceptedAt: null,
    clientAcceptedBy: null,
    clientAcceptanceNote: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    contactId: 'c1',
    contact: { id: 'c1', firstName: 'Ada', lastName: 'Lovelace' },
    additionalContacts: [],
    companyId: 'co-1',
    company: { id: 'co-1', name: 'Acme' },
    project: { id: 'proj-1', name: 'Brand', code: 'P-1' },
    pm: null,
    _count: { extensions: 0, tasks: 0, tickets: 0 },
    extensions: [],
    tasks: [],
    tickets: [],
    order: null,
    ...overrides,
  };
}

describe('productContactsDraftFromProduct', () => {
  it('copies company and contacts', () => {
    expect(productContactsDraftFromProduct(product())).toEqual({
      contactIds: ['c1'],
      contactLabels: { c1: 'Ada Lovelace' },
      companyId: 'co-1',
      companyLabel: 'Acme',
    });
  });
});

describe('buildProductContactsPatch', () => {
  it('emits companyId when the billing company changes', () => {
    const snap = productContactsDraftFromProduct(product());
    expect(
      buildProductContactsPatch(snap, { ...snap, companyId: 'co-2', companyLabel: 'Other' }),
    ).toEqual({ companyId: 'co-2' });
  });
});
