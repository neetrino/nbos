import { describe, expect, it } from 'vitest';
import { applyDealRelationCreated } from './apply-deal-relation-created';
import type { DealGeneralDraft } from './deal-general-form-state';

const baseDraft: DealGeneralDraft = {
  name: null,
  amount: null,
  paymentType: null,
  taxStatus: null,
  projectId: null,
  linkedProjectLabel: null,
  type: null,
  maintenanceStartAt: null,
  productCategory: null,
  productType: null,
  existingProductId: null,
  existingProductPickLabel: null,
  companyId: null,
  companyPickLabel: null,
  source: null,
  sourceDetail: null,
  sourcePartnerId: null,
  sourceContactId: null,
  marketingAccountId: null,
  marketingActivityId: null,
  marketingPickLabel: null,
  partnerPickLabel: null,
  clientPickLabel: null,
  notes: null,
  contactIds: [],
  contactLabels: {},
  sellerId: null,
  sellerDisplayLabel: null,
  sellerAssistantId: null,
  sellerAssistantDisplayLabel: null,
  pmId: null,
  pmDisplayLabel: null,
  deadline: null,
};

describe('applyDealRelationCreated', () => {
  it('appends linked contact without duplicating', () => {
    const withOne = applyDealRelationCreated(baseDraft, {
      kind: 'contact',
      id: 'c-1',
      label: 'Jane Doe',
      intent: 'deal-contacts',
    });
    expect(withOne.contactIds).toEqual(['c-1']);

    const again = applyDealRelationCreated(withOne, {
      kind: 'contact',
      id: 'c-1',
      label: 'Jane Doe',
      intent: 'deal-contacts',
    });
    expect(again.contactIds).toEqual(['c-1']);
  });

  it('maps product create for extension deals', () => {
    const next = applyDealRelationCreated(baseDraft, {
      kind: 'product',
      id: 'p-1',
      label: 'Website',
      intent: 'deal-existing-product',
    });
    expect(next.existingProductId).toBe('p-1');
    expect(next.existingProductPickLabel).toBe('Website');
  });
});
