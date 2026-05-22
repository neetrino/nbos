import { describe, expect, it } from 'vitest';
import { applyProjectContactsRelationCreated } from './apply-project-contacts-relation-created';
import type { ProjectContactsDraft } from './project-contacts-state';

const baseDraft: ProjectContactsDraft = {
  contactId: 'c-main',
  contactLabel: 'Anna',
  companyId: null,
  companyLabel: null,
  additionalContactIds: [],
  additionalContactLabels: {},
};

describe('applyProjectContactsRelationCreated', () => {
  it('sets main contact and drops it from additional', () => {
    const withExtra: ProjectContactsDraft = {
      ...baseDraft,
      additionalContactIds: ['c-main', 'c-other'],
      additionalContactLabels: { 'c-main': 'Anna', 'c-other': 'Sam' },
    };
    const next = applyProjectContactsRelationCreated(withExtra, {
      kind: 'contact',
      id: 'c-new',
      label: 'Jane',
      intent: 'project-main-contact',
    });
    expect(next.contactId).toBe('c-new');
    expect(next.additionalContactIds).toEqual(['c-other']);
  });
});
