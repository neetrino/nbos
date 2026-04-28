import { describe, expect, it } from 'vitest';
import { resolveBlockerDirectActions } from './blocker-actions';

describe('resolveBlockerDirectActions', () => {
  it('maps CRM attribution and finance blockers to direct actions', () => {
    const actions = resolveBlockerDirectActions({
      context: 'crm',
      errors: [
        { field: 'sourceDetail', message: 'Where is required' },
        { field: 'invoice', message: 'Invoice must be created' },
      ],
    });

    expect(actions).toEqual([
      { key: 'attribution', label: 'Open attribution fields', target: 'details' },
      { key: 'finance', label: 'Open deal finance', target: 'finance' },
    ]);
  });

  it('normalizes kickoff checklist item fields for product blockers', () => {
    const actions = resolveBlockerDirectActions({
      context: 'product',
      errors: [{ field: 'kickoffChecklist.scope', message: 'Scope approved' }],
    });

    expect(actions).toEqual([{ key: 'pm-intake', label: 'Open PM intake', target: 'project' }]);
  });

  it('maps extension readiness blockers to extension context', () => {
    const actions = resolveBlockerDirectActions({
      context: 'extension',
      errors: [{ field: 'assignedTo', message: 'Assignee is required' }],
    });

    expect(actions).toEqual([
      { key: 'extension-readiness', label: 'Open extension context', target: 'project' },
    ]);
  });
});
