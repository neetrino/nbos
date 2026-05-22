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
  additionalContactIds: [],
  additionalContactLabels: {},
};

describe('applyLeadRelationCreated', () => {
  it('appends additional contact', () => {
    const next = applyLeadRelationCreated(baseDraft, {
      kind: 'contact',
      id: 'c-2',
      label: 'Samvel K.',
      intent: 'lead-additional-contact',
    });
    expect(next.additionalContactIds).toEqual(['c-2']);
    expect(next.additionalContactLabels['c-2']).toBe('Samvel K.');
  });
});
