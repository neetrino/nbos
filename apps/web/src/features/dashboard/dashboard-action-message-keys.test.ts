import { describe, expect, it } from 'vitest';
import { DASHBOARD_ACTION_MESSAGE_KEYS } from './dashboard-action-message-keys';
import { PINNED_ACTIONS } from './dashboard-control-registry';

describe('dashboard action message keys', () => {
  it('covers every persisted pinned action key', () => {
    expect(Object.keys(DASHBOARD_ACTION_MESSAGE_KEYS).sort()).toEqual(
      PINNED_ACTIONS.map((action) => action.key).sort(),
    );
  });
});
