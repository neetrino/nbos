import { describe, expect, it } from 'vitest';
import type { Lead } from '@/lib/api/leads';
import {
  buildLeadMergeConflicts,
  defaultFieldChoices,
  filterRecentLeadMergeHits,
  getLeadMergeCandidateSubtitle,
  getLeadMergeCandidateTitle,
  getLeadMergeEntityLabel,
  isLeadMergePickBlocked,
  leadToMergeSearchHit,
  suggestedMergeStatus,
} from './lead-merge-wizard';

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    code: 'L-2026-0001',
    name: 'Site',
    contactName: 'Anna',
    phone: '+374111',
    email: null,
    source: 'MARKETING',
    sourceDetail: 'SMM',
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: null,
    marketingActivityId: null,
    status: 'NEW',
    assignedTo: 's1',
    contactId: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    assignee: { id: 's1', firstName: 'Sam', lastName: 'Seller' },
    sourcePartner: null,
    sourceContact: null,
    marketingAccount: null,
    marketingActivity: null,
    deal: null,
    ...overrides,
  };
}

describe('lead-merge-wizard', () => {
  it('lists only fields that both sides have and that differ', () => {
    const conflicts = buildLeadMergeConflicts(
      lead(),
      lead({
        id: 'lead-2',
        code: 'L-2026-0002',
        phone: '+374222',
        source: 'SALES',
        sourceDetail: 'COLD_CALL',
        createdAt: '2026-02-01T00:00:00.000Z',
      }),
    );
    const keys = conflicts.map((row) => row.key);
    expect(keys).toContain('phone');
    expect(keys).toContain('source');
    expect(keys).not.toContain('email');
  });

  it('defaults marketing conflicts to the earlier first-touch side', () => {
    const survivor = lead({
      createdAt: '2026-03-01T00:00:00.000Z',
      source: 'SALES',
      sourceDetail: 'COLD_CALL',
    });
    const absorbed = lead({
      id: 'lead-2',
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'MARKETING',
      sourceDetail: 'SMM',
    });
    const conflicts = buildLeadMergeConflicts(survivor, absorbed);
    const choices = defaultFieldChoices(survivor, absorbed, conflicts);
    expect(choices.source).toBe('absorbed');
    expect(suggestedMergeStatus(survivor, lead({ id: 'b', status: 'MQL' }))).toBe('MQL');
  });

  it('prefers human title over code in merge search labels', () => {
    expect(
      getLeadMergeCandidateTitle({
        code: 'L-2026-0042',
        name: 'Instagram DM',
        contactName: '@shop_client',
      }),
    ).toBe('Instagram DM');
    expect(
      getLeadMergeCandidateSubtitle({
        code: 'L-2026-0042',
        name: 'Instagram DM',
        contactName: '@shop_client',
        phone: null,
        email: null,
        hasOpenDeal: false,
      }),
    ).toContain('L-2026-0042');
    expect(
      getLeadMergeCandidateSubtitle({
        code: 'L-2026-0042',
        name: null,
        contactName: 'Anna Petrosyan',
        phone: '+37499123456',
        email: null,
        hasOpenDeal: false,
      }),
    ).toBe('L-2026-0042 · +37499123456');
  });

  it('blocks SQL and open-deal picks without requiring a Contact', () => {
    expect(isLeadMergePickBlocked({ status: 'SQL', hasOpenDeal: false })).toBe(true);
    expect(isLeadMergePickBlocked({ status: 'NEW', hasOpenDeal: true })).toBe(true);
    expect(isLeadMergePickBlocked({ status: 'NEW', hasOpenDeal: false })).toBe(false);
  });

  it('returns latest active leads for empty merge search', () => {
    const hits = filterRecentLeadMergeHits(
      [
        lead(),
        lead({ id: 'lead-self', code: 'L-2026-0099' }),
        lead({ id: 'lead-sql', status: 'SQL' }),
        lead({ id: 'lead-2', code: 'L-2026-0002', name: 'Second' }),
      ],
      'lead-self',
      2,
    );
    expect(hits.map((hit) => hit.id)).toEqual(['lead-1', 'lead-2']);
    expect(
      leadToMergeSearchHit(lead({ deal: { id: 'd-1', code: 'D-1', status: 'WON' } })).hasOpenDeal,
    ).toBe(false);
  });

  it('labels loaded leads by name instead of code', () => {
    expect(getLeadMergeEntityLabel(lead({ name: 'Site inquiry' }))).toBe('Site inquiry');
    expect(getLeadMergeEntityLabel(lead({ name: null, contactName: 'Anna' }))).toBe('Anna');
  });
});
