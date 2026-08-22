/** Audit entity types owned by the AI Platform module. */
export const AI_AUDIT_ENTITY = {
  agent: 'EXTERNAL_AGENT',
  credential: 'EXTERNAL_AGENT_CREDENTIAL',
  capabilityGrant: 'EXTERNAL_AGENT_CAPABILITY_GRANT',
  resourceScope: 'EXTERNAL_AGENT_RESOURCE_SCOPE',
  capability: 'AGENT_CAPABILITY',
  providerConnection: 'AI_PROVIDER_CONNECTION',
  model: 'AI_MODEL',
  modelPolicy: 'AI_MODEL_POLICY',
  promptPolicy: 'AI_PROMPT_POLICY',
  promptVersion: 'AI_PROMPT_VERSION',
  internalAgent: 'INTERNAL_AI_AGENT',
  internalCapabilityGrant: 'INTERNAL_AI_AGENT_CAPABILITY_GRANT',
  internalResourceScope: 'INTERNAL_AI_AGENT_RESOURCE_SCOPE',
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
  capabilityInvoked: 'AGENT_CAPABILITY_INVOKED',
  providerCreated: 'PROVIDER_CONNECTION_CREATED',
  providerUpdated: 'PROVIDER_CONNECTION_UPDATED',
  providerValidated: 'PROVIDER_CONNECTION_VALIDATED',
  providerKeyRotated: 'PROVIDER_KEY_ROTATED',
  providerKeyPreflight: 'PROVIDER_KEY_PREFLIGHT_VALIDATED',
  providerDisabled: 'PROVIDER_CONNECTION_DISABLED',
  providerEnabled: 'PROVIDER_CONNECTION_ENABLED',
  providerRevoked: 'PROVIDER_CONNECTION_REVOKED',
  modelsSynced: 'MODEL_CATALOG_SYNCED',
  modelActivated: 'MODEL_ACTIVATED',
  modelDisabled: 'MODEL_DISABLED',
  modelUpdated: 'MODEL_UPDATED',
  modelPolicyCreated: 'MODEL_POLICY_CREATED',
  modelPolicyUpdated: 'MODEL_POLICY_UPDATED',
  modelPolicyActivated: 'MODEL_POLICY_ACTIVATED',
  modelPolicyDisabled: 'MODEL_POLICY_DISABLED',
  promptPolicyCreated: 'PROMPT_POLICY_CREATED',
  promptPolicyUpdated: 'PROMPT_POLICY_UPDATED',
  promptVersionCreated: 'PROMPT_VERSION_CREATED',
  promptVersionPublished: 'PROMPT_VERSION_PUBLISHED',
  promptVersionRolledBack: 'PROMPT_VERSION_ROLLED_BACK',
  promptVersionRetired: 'PROMPT_VERSION_RETIRED',
  internalAgentCreated: 'INTERNAL_AGENT_CREATED',
  internalAgentUpdated: 'INTERNAL_AGENT_UPDATED',
  internalAgentActivated: 'INTERNAL_AGENT_ACTIVATED',
  internalAgentPaused: 'INTERNAL_AGENT_PAUSED',
  internalAgentDisabled: 'INTERNAL_AGENT_DISABLED',
  internalAgentArchived: 'INTERNAL_AGENT_ARCHIVED',
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
