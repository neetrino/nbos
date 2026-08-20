import { describe, expect, it } from 'vitest';
import type { Contact } from '@/lib/api/clients';
import type { Lead } from '@/lib/api/leads';
import type { Project } from '@/lib/api/projects';
import {
  leadSvyazatHit,
  SVYAZAT_KIND_LABELS,
  toContactHits,
  toLeadHits,
  toOpenDealHits,
  toProjectHits,
} from './lead-svyazat-search';

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    code: 'L-2026-0001',
    name: 'Site',
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

describe('lead svyazat search', () => {
  it('uses human titles and kind labels for picker rows', () => {
    expect(leadSvyazatHit(lead()).title).toBe('Site');
    expect(leadSvyazatHit(lead({ name: null })).title).toBe('Anna');
    expect(leadSvyazatHit(lead()).kind).toBe('lead');
    expect(SVYAZAT_KIND_LABELS.project).toBe('Project');
    expect(SVYAZAT_KIND_LABELS.product).toBe('Product');
  });

  it('uses contact full name and phone/email subtitle', () => {
    const hits = toContactHits([
      {
        id: 'c1',
        firstName: 'Anna',
        lastName: 'Petrosyan',
        phone: '+374111',
        email: 'anna@nbos.test',
      } as Contact,
    ]);
    expect(hits[0]).toMatchObject({
      kind: 'contact',
      title: 'Anna Petrosyan',
      subtitle: '+374111 · anna@nbos.test',
    });
  });

  it('uses project name as title and code as subtitle', () => {
    const hits = toProjectHits([
      { id: 'p1', name: 'Site rebuild', code: 'PR-1', trashedAt: null } as Project,
      { id: 'p2', name: 'Gone', code: 'PR-2', trashedAt: '2026-01-01' } as Project,
    ]);
    expect(hits.map((hit) => hit.id)).toEqual(['p1']);
    expect(hits[0]).toMatchObject({ kind: 'project', title: 'Site rebuild', subtitle: 'PR-1' });
  });

  it('lists last open leads without requiring a Contact', () => {
    const hits = toLeadHits(
      [
        lead(),
        lead({ id: 'self' }),
        lead({ id: 'sql', status: 'SQL' }),
        lead({ id: 'lead-2', name: 'Second', contactId: null }),
      ],
      'self',
    );
    expect(hits.map((hit) => hit.id)).toEqual(['lead-1', 'lead-2']);
  });

  it('keeps only open Deals', () => {
    const hits = toOpenDealHits([
      {
        id: 'd-open',
        code: 'D-1',
        name: 'Website',
        status: 'START_CONVERSATION',
      } as never,
      {
        id: 'd-won',
        code: 'D-2',
        name: 'Won',
        status: 'WON',
      } as never,
    ]);
    expect(hits.map((hit) => hit.id)).toEqual(['d-open']);
    expect(hits[0]?.title).toBe('Website');
    expect(hits[0]?.kind).toBe('deal');
  });
});
