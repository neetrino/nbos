import { describe, expect, it } from 'vitest';
import type { Lead } from '@/lib/api/leads';
import { canIdentifyLeadByState, canShowLeadIdentifySection } from './lead-identify-access';

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l1',
    code: 'L-1',
    name: null,
    contactName: 'Anna',
    phone: '+374111',
    email: null,
    source: null,
    sourceDetail: null,
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: null,
    marketingActivityId: null,
    status: 'NEW',
    assignedTo: null,
    contactId: null,
    notes: null,
    createdAt: '',
    updatedAt: '',
    assignee: null,
    sourcePartner: null,
    sourceContact: null,
    marketingAccount: null,
    marketingActivity: null,
    deal: null,
    ...overrides,
  };
}

describe('canIdentifyLeadByState', () => {
  it('hides identify in trash, SQL, merged, or when a Deal exists', () => {
    expect(canIdentifyLeadByState(lead(), false)).toBe(true);
    expect(canIdentifyLeadByState(lead(), true)).toBe(false);
    expect(canIdentifyLeadByState(lead({ status: 'SQL' }), false)).toBe(false);
    expect(canIdentifyLeadByState(lead({ mergedIntoId: 'other' }), false)).toBe(false);
    expect(
      canIdentifyLeadByState(
        lead({ deal: { id: 'd1', code: 'D-1', status: 'START_CONVERSATION' } }),
        false,
      ),
    ).toBe(false);
  });
});

describe('canShowLeadIdentifySection', () => {
  it('allows Head of Sales on any open Lead', () => {
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: 'other' }),
        isTrashView: false,
        roleSlug: 'head-sales',
        actorId: 'h1',
      }),
    ).toBe(true);
  });

  it('allows Seller only on their assigned Lead', () => {
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: 's1' }),
        isTrashView: false,
        roleSlug: 'seller',
        actorId: 's1',
      }),
    ).toBe(true);
  });

  it('hides identify for Seller on unassigned or someone else Lead', () => {
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: null }),
        isTrashView: false,
        roleSlug: 'seller',
        actorId: 's1',
      }),
    ).toBe(false);
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: 's2' }),
        isTrashView: false,
        roleSlug: 'seller',
        actorId: 's1',
      }),
    ).toBe(false);
  });

  it('never shows identify for Marketing', () => {
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: 'm1' }),
        isTrashView: false,
        roleSlug: 'marketing',
        actorId: 'm1',
      }),
    ).toBe(false);
  });
});
