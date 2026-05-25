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
      { key: 'attribution', label: 'Go to attribution & contact', target: 'details' },
      { key: 'finance', label: 'Go to invoice', target: 'finance' },
    ]);
  });

  it('normalizes checklist instance fields for product blockers', () => {
    const actions = resolveBlockerDirectActions({
      context: 'product',
      errors: [{ field: 'checklist.instance-1', message: 'Starting checklist must be completed' }],
    });

    expect(actions).toEqual([
      { key: 'pm-intake', label: 'Open product overview', target: 'project' },
    ]);
  });

  it('maps product Done blockers to delivery context', () => {
    const actions = resolveBlockerDirectActions({
      context: 'product',
      errors: [{ field: 'tasks', message: 'Tasks remain open' }],
    });

    expect(actions).toEqual([
      { key: 'product-workspace-tasks', label: 'Open Work Space', target: 'project' },
    ]);
  });

  it('maps extension readiness blockers to extension context', () => {
    const actions = resolveBlockerDirectActions({
      context: 'extension',
      errors: [{ field: 'assignedTo', message: 'Assignee is required' }],
    });

    expect(actions).toEqual([
      { key: 'extension-intake', label: 'Open extension on product', target: 'project' },
    ]);
  });

  it('maps extension Done task blockers to extension context', () => {
    const actions = resolveBlockerDirectActions({
      context: 'extension',
      errors: [{ field: 'tasks', message: 'Tasks remain open' }],
    });

    expect(actions).toEqual([
      { key: 'extension-workspace-tasks', label: 'Open Work Space', target: 'project' },
    ]);
  });
});
