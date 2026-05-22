import { describe, expect, it } from 'vitest';
import { applyLeadRelationCreated } from './apply-lead-relation-created';
import type { LeadGeneralDraft } from './lead-general-form-state';

const baseDraft: LeadGeneralDraft = {
  name: null,
  contactName: 'Anna',
  phone: null,
  email: null,
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
  assignedTo: null,
  sellerDisplayLabel: null,
  contactIds: [],
  contactLabels: {},
};

describe('applyLeadRelationCreated', () => {
  it('appends linked contact', () => {
    const next = applyLeadRelationCreated(baseDraft, {
      kind: 'contact',
      id: 'c-2',
      label: 'Samvel K.',
      intent: 'lead-contacts',
    });
    expect(next.contactIds).toEqual(['c-2']);
    expect(next.contactLabels['c-2']).toBe('Samvel K.');
  });
});
