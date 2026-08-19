import { describe, expect, it } from 'vitest';
import {
  buildContactMergeConflicts,
  defaultContactFieldChoices,
  isContactRestoreBlocked,
} from './contact-merge-wizard';
import type { Contact } from '@/lib/api/clients';

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'c-1',
    firstName: 'Anna',
    lastName: 'Sargsyan',
    phone: '+37499000000',
    email: 'a@test.com',
    role: 'CLIENT',
    notes: null,
    messengerLinks: null,
    extraPhones: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    companies: [],
    _count: { projects: 0, leads: 0, deals: 0 },
    ...overrides,
  };
}

describe('buildContactMergeConflicts', () => {
  it('lists only conflicting filled fields', () => {
    const conflicts = buildContactMergeConflicts(
      contact(),
      contact({ id: 'c-2', firstName: 'Anahit', phone: '+37499111111', email: 'a@test.com' }),
    );
    expect(conflicts.map((row) => row.key)).toEqual(['firstName', 'phone']);
    expect(defaultContactFieldChoices(conflicts)).toEqual({
      firstName: 'survivor',
      phone: 'survivor',
    });
  });
});

describe('isContactRestoreBlocked', () => {
  it('blocks restore when mergedIntoId is set', () => {
    expect(isContactRestoreBlocked(contact({ mergedIntoId: 'surv-1' }))).toBe(true);
    expect(isContactRestoreBlocked(contact({ mergedIntoId: null }))).toBe(false);
  });
});
