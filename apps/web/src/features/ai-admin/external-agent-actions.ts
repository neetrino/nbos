import type { ExternalAgentState } from '@/lib/api/ai-admin';

/** REVOKED is terminal — Chat 2 invariant. UI must not offer enable or issue. */
export function canEnableExternalAgent(state: ExternalAgentState): boolean {
  return state === 'DISABLED';
}

export function canIssueExternalAgentToken(state: ExternalAgentState): boolean {
  return state === 'ACTIVE' || state === 'DISABLED';
}

export function canGrantExternalAgentAccess(state: ExternalAgentState): boolean {
  return state === 'ACTIVE' || state === 'DISABLED';
}

export function canRotateAgentCredential(
  agentState: ExternalAgentState,
  credentialState: 'ACTIVE' | 'REVOKED' | 'EXPIRED',
): boolean {
  return canIssueExternalAgentToken(agentState) && credentialState !== 'REVOKED';
}

export function canExtendExternalAgentExpiry(state: ExternalAgentState): boolean {
  return state === 'EXPIRED';
}

export function isExternalAgentRevoked(state: ExternalAgentState): boolean {
  return state === 'REVOKED';
}
