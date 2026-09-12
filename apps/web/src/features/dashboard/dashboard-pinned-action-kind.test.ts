import { describe, expect, it } from 'vitest';
import { PINNED_ACTIONS } from './dashboard-control-registry';
import {
  isPinnedCreateAction,
  isPinnedOpenAction,
  partitionPinnedActionsByKind,
} from './dashboard-pinned-action-kind';

describe('pinned action kinds', () => {
  it('keeps create and open actions in separate groups without dropping keys', () => {
    const { create, open } = partitionPinnedActionsByKind(PINNED_ACTIONS);
    expect(create.every(isPinnedCreateAction)).toBe(true);
    expect(open.every(isPinnedOpenAction)).toBe(true);
    expect(create.map((action) => action.key)).toEqual([
      'new-task',
      'new-meeting',
      'new-lead',
      'new-expense',
    ]);
    expect([...create, ...open].map((action) => action.key)).toEqual(
      PINNED_ACTIONS.map((action) => action.key),
    );
  });

  it('requires href only on open actions', () => {
    for (const action of PINNED_ACTIONS) {
      if (isPinnedCreateAction(action)) {
        expect('href' in action).toBe(false);
        continue;
      }
      expect(action.href.startsWith('/')).toBe(true);
    }
  });
});
