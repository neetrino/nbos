import { describe, expect, it } from 'vitest';
import { mergePickedLink, pickedWorkspaceId } from './use-quick-create-task-extras';

const project = {
  kind: 'PROJECT' as const,
  entityId: 'p1',
  label: 'Alpha',
  contextLabel: null,
};

describe('mergePickedLink', () => {
  it('replaces an existing work space instead of stacking two', () => {
    const first = { kind: 'WORK_SPACE' as const, entityId: 'ws-1', label: 'A', contextLabel: null };
    const second = {
      kind: 'WORK_SPACE' as const,
      entityId: 'ws-2',
      label: 'B',
      contextLabel: null,
    };
    expect(mergePickedLink([project, first], second)).toEqual([project, second]);
  });

  it('does not duplicate the same project', () => {
    expect(mergePickedLink([project], project)).toEqual([project]);
  });
});

describe('pickedWorkspaceId', () => {
  it('reads the work space id from draft links', () => {
    expect(pickedWorkspaceId([project])).toBeUndefined();
    expect(
      pickedWorkspaceId([
        { kind: 'WORK_SPACE', entityId: 'ws-1', label: 'Board', contextLabel: null },
      ]),
    ).toBe('ws-1');
  });
});
