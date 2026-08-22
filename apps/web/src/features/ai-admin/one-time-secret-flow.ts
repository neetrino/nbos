export type CreateAgentIssueOutcome =
  | { kind: 'created-with-token'; agentId: string; token: string }
  | { kind: 'created-without-token'; agentId: string }
  | { kind: 'created-issue-failed'; agentId: string }
  | { kind: 'create-failed' };

export function finishCreateWithOptionalIssue(params: {
  agentId: string | null;
  issueRequested: boolean;
  token: string | null;
  issueFailed: boolean;
}): CreateAgentIssueOutcome {
  if (!params.agentId) {
    return { kind: 'create-failed' };
  }
  if (!params.issueRequested) {
    return { kind: 'created-without-token', agentId: params.agentId };
  }
  if (params.token) {
    return { kind: 'created-with-token', agentId: params.agentId, token: params.token };
  }
  if (params.issueFailed) {
    return { kind: 'created-issue-failed', agentId: params.agentId };
  }
  return { kind: 'created-issue-failed', agentId: params.agentId };
}

/** Parent list/detail must not remount while a raw token is on screen. */
export function shouldRefreshAfterSecretAction(rawToken: string | null): boolean {
  return rawToken === null;
}

export function shouldKeepCreateHostMounted(params: {
  createOpen: boolean;
  secretOpen: boolean;
}): boolean {
  return params.createOpen || params.secretOpen;
}
