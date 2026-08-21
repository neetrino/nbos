import type { AiPolicyDenyReason } from './policy-decision';

/** Stable machine-readable classes from `09-External-Agent-API-and-MCP-Contract.md`. */
export const AI_AGENT_ERROR_CODES = [
  'AGENT_AUTH_INVALID',
  'AGENT_CREDENTIAL_REVOKED',
  'AGENT_CREDENTIAL_EXPIRED',
  'AGENT_DISABLED',
  'AGENT_CAPABILITY_DENIED',
  'AGENT_SCOPE_DENIED',
  'AGENT_APPROVAL_REQUIRED',
  'AGENT_RESOURCE_NOT_AVAILABLE',
  'AGENT_VALIDATION_FAILED',
  'AGENT_CONFLICT',
  'AGENT_IDEMPOTENCY_CONFLICT',
  'AGENT_RATE_LIMITED',
  'AGENT_PROVIDER_UNAVAILABLE',
] as const;

export type AiAgentErrorCode = (typeof AI_AGENT_ERROR_CODES)[number];

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_TOO_MANY_REQUESTS = 429;

export interface AiAgentExternalError {
  code: AiAgentErrorCode;
  status: number;
  message: string;
}

const GENERIC_DENIED_MESSAGE = 'The requested operation is not available to this agent.';
const GENERIC_UNAVAILABLE_MESSAGE = 'The requested resource is not available to this agent.';

/**
 * Internal reason to safe external error.
 *
 * Anti-enumeration rule: an out-of-scope resource and a non-existent resource
 * must be indistinguishable, so both surface as `AGENT_RESOURCE_NOT_AVAILABLE`
 * with an identical message.
 */
const DENY_REASON_TO_ERROR: Record<AiPolicyDenyReason, AiAgentExternalError> = {
  ACTOR_NOT_SUPPORTED: {
    code: 'AGENT_AUTH_INVALID',
    status: HTTP_UNAUTHORIZED,
    message: 'Authentication failed.',
  },
  AGENT_DISABLED: {
    code: 'AGENT_DISABLED',
    status: HTTP_FORBIDDEN,
    message: 'This agent is disabled.',
  },
  AGENT_REVOKED: {
    code: 'AGENT_DISABLED',
    status: HTTP_FORBIDDEN,
    message: 'This agent is disabled.',
  },
  AGENT_EXPIRED: {
    code: 'AGENT_DISABLED',
    status: HTTP_FORBIDDEN,
    message: 'This agent is disabled.',
  },
  CREDENTIAL_INVALID: {
    code: 'AGENT_AUTH_INVALID',
    status: HTTP_UNAUTHORIZED,
    message: 'Authentication failed.',
  },
  CREDENTIAL_REVOKED: {
    code: 'AGENT_CREDENTIAL_REVOKED',
    status: HTTP_UNAUTHORIZED,
    message: 'This credential has been revoked.',
  },
  CREDENTIAL_EXPIRED: {
    code: 'AGENT_CREDENTIAL_EXPIRED',
    status: HTTP_UNAUTHORIZED,
    message: 'This credential has expired.',
  },
  CAPABILITY_UNKNOWN: {
    code: 'AGENT_CAPABILITY_DENIED',
    status: HTTP_FORBIDDEN,
    message: GENERIC_DENIED_MESSAGE,
  },
  CAPABILITY_DEPRECATED: {
    code: 'AGENT_CAPABILITY_DENIED',
    status: HTTP_FORBIDDEN,
    message: GENERIC_DENIED_MESSAGE,
  },
  CAPABILITY_NOT_GRANTED: {
    code: 'AGENT_CAPABILITY_DENIED',
    status: HTTP_FORBIDDEN,
    message: GENERIC_DENIED_MESSAGE,
  },
  CAPABILITY_GRANT_EXPIRED: {
    code: 'AGENT_CAPABILITY_DENIED',
    status: HTTP_FORBIDDEN,
    message: GENERIC_DENIED_MESSAGE,
  },
  CAPABILITY_GRANT_REVOKED: {
    code: 'AGENT_CAPABILITY_DENIED',
    status: HTTP_FORBIDDEN,
    message: GENERIC_DENIED_MESSAGE,
  },
  MODULE_RESTRICTED: {
    code: 'AGENT_CAPABILITY_DENIED',
    status: HTTP_FORBIDDEN,
    message: GENERIC_DENIED_MESSAGE,
  },
  RISK_NOT_PERMITTED: {
    code: 'AGENT_CAPABILITY_DENIED',
    status: HTTP_FORBIDDEN,
    message: GENERIC_DENIED_MESSAGE,
  },
  SCOPE_TYPE_NOT_ALLOWED: {
    code: 'AGENT_SCOPE_DENIED',
    status: HTTP_FORBIDDEN,
    message: GENERIC_DENIED_MESSAGE,
  },
  RESOURCE_OUT_OF_SCOPE: {
    code: 'AGENT_RESOURCE_NOT_AVAILABLE',
    status: HTTP_NOT_FOUND,
    message: GENERIC_UNAVAILABLE_MESSAGE,
  },
  DATA_CLASSIFICATION_FORBIDDEN: {
    code: 'AGENT_RESOURCE_NOT_AVAILABLE',
    status: HTTP_NOT_FOUND,
    message: GENERIC_UNAVAILABLE_MESSAGE,
  },
  DATA_CLASSIFICATION_UNKNOWN: {
    code: 'AGENT_RESOURCE_NOT_AVAILABLE',
    status: HTTP_NOT_FOUND,
    message: GENERIC_UNAVAILABLE_MESSAGE,
  },
  RATE_LIMITED: {
    code: 'AGENT_RATE_LIMITED',
    status: HTTP_TOO_MANY_REQUESTS,
    message: 'Rate limit exceeded for this agent credential.',
  },
};

export function toAgentExternalError(reason: AiPolicyDenyReason): AiAgentExternalError {
  return DENY_REASON_TO_ERROR[reason];
}

export const AI_AGENT_APPROVAL_REQUIRED_ERROR: AiAgentExternalError = {
  code: 'AGENT_APPROVAL_REQUIRED',
  status: HTTP_FORBIDDEN,
  message: 'This operation requires human approval.',
};

/** Used when a record is missing, so missing and unauthorized look identical. */
export const AI_AGENT_RESOURCE_NOT_AVAILABLE_ERROR: AiAgentExternalError = {
  code: 'AGENT_RESOURCE_NOT_AVAILABLE',
  status: HTTP_NOT_FOUND,
  message: GENERIC_UNAVAILABLE_MESSAGE,
};
