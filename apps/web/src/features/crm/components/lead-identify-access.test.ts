import { describe, expect, it } from 'vitest';
import type { Lead } from '@/lib/api/leads';
import { canShowLeadIdentifySection } from './lead-identify-access';

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

describe('canShowLeadIdentifySection', () => {
  it('allows Head of Sales on any active Lead, including New and SQL', () => {
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: 'other' }),
        isTrashView: false,
        roleSlug: 'head-sales',
        actorId: 'h1',
      }),
    ).toBe(true);
    expect(
      canShowLeadIdentifySection({
        lead: lead({ status: 'SQL', assignedTo: 'other' }),
        isTrashView: false,
        roleSlug: 'head-sales',
        actorId: 'h1',
      }),
    ).toBe(true);
  });

  it('allows Founder via isPlatformOwner even with slug owner', () => {
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: 'other', status: 'NEW' }),
        isTrashView: false,
        roleSlug: 'owner',
        actorId: 'founder',
        isPlatformOwner: true,
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

  it('hides Связать for Seller on unassigned or someone else Lead', () => {
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

  it('never shows Связать for Marketing', () => {
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: 'm1' }),
        isTrashView: false,
        roleSlug: 'marketing',
        actorId: 'm1',
      }),
    ).toBe(false);
  });

  it('hides Связать in Trash', () => {
    expect(
      canShowLeadIdentifySection({
        lead: lead({ assignedTo: 'h1' }),
        isTrashView: true,
        roleSlug: 'head-sales',
        actorId: 'h1',
      }),
    ).toBe(false);
  });
});
