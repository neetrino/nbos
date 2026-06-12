import { describe, expect, it } from 'vitest';
import { LIFECYCLE_ACTIONS, parseEntityLifecycleScope, isTrashScope } from './entity-lifecycle';

describe('parseEntityLifecycleScope', () => {
  it('defaults to active', () => {
    expect(parseEntityLifecycleScope(undefined)).toBe('active');
    expect(parseEntityLifecycleScope('')).toBe('active');
  });

  it('parses trash and legacy archived alias', () => {
    expect(parseEntityLifecycleScope('trash')).toBe('trash');
    expect(parseEntityLifecycleScope('ARCHIVED')).toBe('trash');
  });

  it('falls back for unknown values', () => {
    expect(parseEntityLifecycleScope('bogus', 'trash')).toBe('trash');
  });
});

describe('lifecycle actions', () => {
  it('exposes stable action constants', () => {
    expect(LIFECYCLE_ACTIONS.MOVE_TO_TRASH).toBe('move_to_trash');
    expect(LIFECYCLE_ACTIONS.RESTORE_FROM_TRASH).toBe('restore_from_trash');
    expect(LIFECYCLE_ACTIONS.PURGE).toBe('purge');
  });
});

describe('isTrashScope', () => {
  it('identifies trash scope', () => {
    expect(isTrashScope('trash')).toBe(true);
    expect(isTrashScope('active')).toBe(false);
  });
});
