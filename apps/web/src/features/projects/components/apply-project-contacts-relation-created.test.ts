import { describe, expect, it } from 'vitest';
import { applyProjectContactsRelationCreated } from './apply-project-contacts-relation-created';
import type { ProjectContactsDraft } from './project-contacts-state';

const baseDraft: ProjectContactsDraft = {
  contactIds: ['c-main'],
  contactLabels: { 'c-main': 'Anna' },
  companyId: null,
  companyLabel: null,
};

describe('applyProjectContactsRelationCreated', () => {
  it('appends contact without duplicating', () => {
    const next = applyProjectContactsRelationCreated(baseDraft, {
      kind: 'contact',
      id: 'c-other',
      label: 'Sam',
      intent: 'project-contacts',
    });
    expect(next.contactIds).toEqual(['c-main', 'c-other']);
    expect(next.contactLabels['c-other']).toBe('Sam');
  });
});
