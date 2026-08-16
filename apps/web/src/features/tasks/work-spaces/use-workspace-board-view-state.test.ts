import { describe, expect, it } from 'vitest';
import { resolveWorkspaceBoardViewChange } from './use-workspace-board-view-state';

describe('resolveWorkspaceBoardViewChange', () => {
  it('keeps persistable modes', () => {
    expect(resolveWorkspaceBoardViewChange('kanban', 'my-plan')).toEqual({
      kind: 'view',
      value: 'my-plan',
    });
  });

  it('routes planning to the workspace area instead of persisting it', () => {
    expect(resolveWorkspaceBoardViewChange('my-plan', 'planning')).toEqual({
      kind: 'planning',
    });
  });
});
