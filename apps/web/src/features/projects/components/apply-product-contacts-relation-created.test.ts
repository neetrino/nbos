import { describe, expect, it } from 'vitest';
import { applyProductContactsRelationCreated } from './apply-product-contacts-relation-created';
import type { ProductContactsDraft } from './product-contacts-state';

const baseDraft: ProductContactsDraft = {
  contactIds: ['c-main'],
  contactLabels: { 'c-main': 'Anna' },
  companyId: null,
  companyLabel: null,
};

describe('applyProductContactsRelationCreated', () => {
  it('sets the product billing company', () => {
    const next = applyProductContactsRelationCreated(baseDraft, {
      kind: 'company',
      id: 'co-1',
      label: 'Acme',
      intent: 'product-company',
    });
    expect(next.companyId).toBe('co-1');
    expect(next.companyLabel).toBe('Acme');
  });
});
