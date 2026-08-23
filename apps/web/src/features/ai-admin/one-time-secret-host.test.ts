import { describe, expect, it } from 'vitest';
import {
  initialSecretHostState,
  isCreateHostMounted,
  isSecretVisible,
  reduceSecretHost,
} from './one-time-secret-host';

describe('one-time secret host remount', () => {
  it('keeps the create token visible when the parent starts loading', () => {
    let state = reduceSecretHost(initialSecretHostState(), { type: 'OPEN_CREATE' });
    state = reduceSecretHost(state, {
      type: 'CREATE_WITH_TOKEN',
      agentId: 'agent-1',
      token: 'nbos_agt_once',
    });
    state = reduceSecretHost(state, { type: 'PARENT_REFRESH_START' });

    expect(isSecretVisible(state)).toBe(true);
    expect(isCreateHostMounted(state)).toBe(true);
    expect(state.secret).toBe('nbos_agt_once');
    expect(state.loading).toBe(true);
  });

  it('keeps issue and rotate tokens through a parent refresh', () => {
    const issued = reduceSecretHost(initialSecretHostState(), {
      type: 'ISSUE_WITH_TOKEN',
      token: 'issued-once',
    });
    const afterIssueRefresh = reduceSecretHost(issued, { type: 'PARENT_REFRESH_START' });
    expect(afterIssueRefresh.secret).toBe('issued-once');

    const rotated = reduceSecretHost(initialSecretHostState(), {
      type: 'ROTATE_WITH_TOKEN',
      token: 'rotated-once',
    });
    const afterRotateRefresh = reduceSecretHost(rotated, { type: 'PARENT_REFRESH_START' });
    expect(afterRotateRefresh.secret).toBe('rotated-once');
  });

  it('does not cancel create while a raw token is visible', () => {
    let state = reduceSecretHost(initialSecretHostState(), {
      type: 'CREATE_WITH_TOKEN',
      agentId: 'agent-1',
      token: 'nbos_agt_once',
    });
    state = reduceSecretHost(state, { type: 'CANCEL_CREATE' });
    expect(isSecretVisible(state)).toBe(true);
    expect(isCreateHostMounted(state)).toBe(true);
  });

  it('unmounts the create host after the secret is closed', () => {
    let state = reduceSecretHost(initialSecretHostState(), {
      type: 'CREATE_WITH_TOKEN',
      agentId: 'agent-1',
      token: 'nbos_agt_once',
    });
    state = reduceSecretHost(state, { type: 'CLOSE_SECRET' });
    expect(isSecretVisible(state)).toBe(false);
    expect(isCreateHostMounted(state)).toBe(false);
  });
});
