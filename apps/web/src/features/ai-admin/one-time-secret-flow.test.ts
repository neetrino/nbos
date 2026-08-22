import { describe, expect, it } from 'vitest';
import {
  finishCreateWithOptionalIssue,
  shouldKeepCreateHostMounted,
  shouldRefreshAfterSecretAction,
} from './one-time-secret-flow';

describe('one-time secret flow', () => {
  it('keeps the create host mounted while the secret modal is open', () => {
    expect(shouldKeepCreateHostMounted({ createOpen: false, secretOpen: true })).toBe(true);
    expect(shouldKeepCreateHostMounted({ createOpen: true, secretOpen: false })).toBe(true);
    expect(shouldKeepCreateHostMounted({ createOpen: false, secretOpen: false })).toBe(false);
  });

  it('does not refresh the parent while a raw token is visible', () => {
    expect(shouldRefreshAfterSecretAction('nbos_agt_secret')).toBe(false);
    expect(shouldRefreshAfterSecretAction(null)).toBe(true);
  });

  it('separates create success from later issue failure', () => {
    expect(
      finishCreateWithOptionalIssue({
        agentId: 'agent-1',
        issueRequested: true,
        token: null,
        issueFailed: true,
      }),
    ).toEqual({ kind: 'created-issue-failed', agentId: 'agent-1' });
    expect(
      finishCreateWithOptionalIssue({
        agentId: 'agent-1',
        issueRequested: true,
        token: 'nbos_agt_once',
        issueFailed: false,
      }),
    ).toEqual({ kind: 'created-with-token', agentId: 'agent-1', token: 'nbos_agt_once' });
  });
});
