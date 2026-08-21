/** Audit entity types owned by the AI Platform module. */
export const AI_AUDIT_ENTITY = {
  agent: 'EXTERNAL_AGENT',
  credential: 'EXTERNAL_AGENT_CREDENTIAL',
  capabilityGrant: 'EXTERNAL_AGENT_CAPABILITY_GRANT',
  resourceScope: 'EXTERNAL_AGENT_RESOURCE_SCOPE',
} as const;

/** Audit actions for External Agent lifecycle and authorization outcomes. */
export const AI_AUDIT_ACTION = {
  agentCreated: 'AGENT_CREATED',
  agentUpdated: 'AGENT_UPDATED',
  agentDisabled: 'AGENT_DISABLED',
  agentEnabled: 'AGENT_ENABLED',
  agentRevoked: 'AGENT_REVOKED',
  credentialIssued: 'CREDENTIAL_ISSUED',
  credentialRotated: 'CREDENTIAL_ROTATED',
  credentialRevoked: 'CREDENTIAL_REVOKED',
  capabilityGranted: 'CAPABILITY_GRANTED',
  capabilityRevoked: 'CAPABILITY_REVOKED',
  scopeGranted: 'SCOPE_GRANTED',
  scopeRevoked: 'SCOPE_REVOKED',
  policyDenied: 'AGENT_POLICY_DENIED',
} as const;

/** Maximum agent name / description lengths accepted at the boundary. */
export const AGENT_NAME_MAX_LENGTH = 120;
export const AGENT_DESCRIPTION_MAX_LENGTH = 1_000;
export const AGENT_CREDENTIAL_LABEL_MAX_LENGTH = 120;
export const AGENT_GRANT_REASON_MAX_LENGTH = 500;

/**
 * Longest controlled-overlap window a rotation may grant the previous
 * credential. Two valid credentials for one agent is a deliberately bounded
 * state: long enough for a client to redeploy, short enough that a leaked
 * predecessor is not a standing key.
 *
 * 24 hours, approved 2026-08-21. Raising it lengthens the window in which a
 * leaked predecessor secret still authenticates, so it is a security decision,
 * not a convenience knob.
 */
export const AGENT_CREDENTIAL_MAX_OVERLAP_MS = 24 * 60 * 60 * 1_000;
