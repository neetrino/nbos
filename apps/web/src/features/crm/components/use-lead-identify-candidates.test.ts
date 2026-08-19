import { describe, expect, it } from 'vitest';
import { identifySearchFromLead } from './use-lead-identify-candidates';
import type { Lead } from '@/lib/api/leads';

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l1',
    code: 'L-1',
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

describe('identifySearchFromLead', () => {
  it('uses contactName for banner search', () => {
    expect(identifySearchFromLead(lead({ contactName: 'Anna Petrosyan' }))).toBe('Anna Petrosyan');
  });

  it('skips ATS incoming-call placeholders', () => {
    expect(identifySearchFromLead(lead({ contactName: 'Incoming call +37499111111' }))).toBe('');
  });
});
