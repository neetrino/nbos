import { describe, expect, it } from 'vitest';
import type { Lead } from '@/lib/api/leads';
import { getLocalLeadStageGateErrors } from './lead-stage-gate';

function lead(partial: Partial<Lead> = {}): Lead {
  return {
    id: 'l1',
    code: 'L-1',
    name: 'Acme',
    contactName: 'Jane',
    phone: '+10000000000',
    email: null,
    status: 'NEW',
    source: 'WEB',
    sourceDetail: null,
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: null,
    marketingActivityId: null,
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
    ...partial,
  };
}

describe('getLocalLeadStageGateErrors', () => {
  it('requires notes when marking lead as spam', () => {
    const errors = getLocalLeadStageGateErrors(lead(), 'SPAM');
    expect(errors.some((e) => e.field === 'notes')).toBe(true);
  });

  it('returns empty for spam when notes are provided', () => {
    const errors = getLocalLeadStageGateErrors(lead({ notes: 'Duplicate inbound' }), 'SPAM');
    expect(errors).toEqual([]);
  });
});
