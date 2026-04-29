import { describe, it, expect } from 'vitest';
import { employeeCanReadDocumentRow } from './documents-access-read';

describe('employeeCanReadDocumentRow', () => {
  const sectionAll = { defaultListScope: 'ALL' as const };
  const sectionOwn = { defaultListScope: 'OWN' as const };

  it('allows ALL rbac on foreign doc when section is ALL', () => {
    expect(
      employeeCanReadDocumentRow(
        {
          ownerId: 'other',
          createdById: 'other',
          listScopeOverride: null,
          section: sectionAll,
        },
        'ALL',
        'me',
        [],
      ),
    ).toBe(true);
  });

  it('denies ALL rbac on foreign doc when section is OWN', () => {
    expect(
      employeeCanReadDocumentRow(
        {
          ownerId: 'other',
          createdById: 'other',
          listScopeOverride: null,
          section: sectionOwn,
        },
        'ALL',
        'me',
        [],
      ),
    ).toBe(false);
  });

  it('allows OWN rbac on own doc when section is OWN', () => {
    expect(
      employeeCanReadDocumentRow(
        {
          ownerId: 'me',
          createdById: 'me',
          listScopeOverride: null,
          section: sectionOwn,
        },
        'OWN',
        'me',
        [],
      ),
    ).toBe(true);
  });
});
