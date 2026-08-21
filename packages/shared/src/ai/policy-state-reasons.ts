import type { AiAgentState, AiCredentialState, AiPolicyDenyReason } from './policy-decision';

/** Null means the state is usable. Shared by the auth boundary and the evaluator. */
export function agentStateDenyReason(state: AiAgentState): AiPolicyDenyReason | null {
  switch (state) {
    case 'ACTIVE':
      return null;
    case 'DISABLED':
      return 'AGENT_DISABLED';
    case 'EXPIRED':
      return 'AGENT_EXPIRED';
    default:
      return 'AGENT_REVOKED';
  }
}

export function credentialStateDenyReason(state: AiCredentialState): AiPolicyDenyReason | null {
  switch (state) {
    case 'ACTIVE':
      return null;
    case 'REVOKED':
      return 'CREDENTIAL_REVOKED';
    case 'EXPIRED':
      return 'CREDENTIAL_EXPIRED';
    default:
      return 'CREDENTIAL_INVALID';
  }
}
