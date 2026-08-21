import { isMachineActorType } from '../actor';
import { findMatchingScope } from './agent-scope';
import {
  isDataClassificationWithin,
  type AiCapabilityDefinition,
  type AiRiskClass,
} from './capability-types';
import {
  type AiPolicyDecision,
  type AiPolicyDenyReason,
  type AiPolicyRequest,
} from './policy-decision';
import { agentStateDenyReason, credentialStateDenyReason } from './policy-state-reasons';

const RISK_RANK: Record<AiRiskClass, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const DEFAULT_MAX_RISK: AiRiskClass = 'MEDIUM';

function deny(reason: AiPolicyDenyReason): AiPolicyDecision {
  return { outcome: 'DENY', reason };
}

/** Principal state: actor kind, agent lifecycle, credential lifecycle. */
function denyForPrincipal(request: AiPolicyRequest): AiPolicyDenyReason | null {
  if (!isMachineActorType(request.actor.actor.type)) {
    return 'ACTOR_NOT_SUPPORTED';
  }
  return (
    agentStateDenyReason(request.agentState) ?? credentialStateDenyReason(request.credentialState)
  );
}

function denyForGrant(request: AiPolicyRequest): AiPolicyDenyReason | null {
  const { grant, capabilityKey } = request;
  if (!grant || grant.capabilityKey !== capabilityKey) {
    return 'CAPABILITY_NOT_GRANTED';
  }
  if (grant.revoked) {
    return 'CAPABILITY_GRANT_REVOKED';
  }
  if (grant.expired) {
    return 'CAPABILITY_GRANT_EXPIRED';
  }
  return null;
}

/**
 * Capability-level constraints that do not depend on the concrete resource:
 * module availability, risk ceiling and data classification.
 *
 * Classification is fail-closed. When a capability declares that it touches
 * resources with their own confidentiality, an absent classification is a
 * missing input, not a permissive default.
 */
function denyForCapabilityConstraints(
  request: AiPolicyRequest,
  capability: AiCapabilityDefinition,
): AiPolicyDenyReason | null {
  if (request.restrictedModules?.includes(capability.module)) {
    return 'MODULE_RESTRICTED';
  }

  const maxRisk = request.maxRiskClass ?? DEFAULT_MAX_RISK;
  if (RISK_RANK[capability.risk] > RISK_RANK[maxRisk]) {
    return 'RISK_NOT_PERMITTED';
  }

  const classification = request.targetDataClassification;
  if (!classification) {
    return capability.requiresTargetDataClassification ? 'DATA_CLASSIFICATION_UNKNOWN' : null;
  }
  return isDataClassificationWithin(classification, capability.maxDataClassification)
    ? null
    : 'DATA_CLASSIFICATION_FORBIDDEN';
}

/**
 * The single deny-by-default authorization decision for every AI actor.
 *
 * REST and MCP must both route through this function; neither owns its own
 * permission logic. Untrusted content (task text, documents, messages) is not
 * an input and therefore cannot influence the outcome.
 *
 * Ordering is deliberate: everything that is independent of the concrete
 * resource — including the rate limit — is decided before the scope match, so
 * the response cannot be used to probe which resources an agent can reach.
 */
export function evaluateAiPolicy(request: AiPolicyRequest): AiPolicyDecision {
  const principalDenial = denyForPrincipal(request);
  if (principalDenial) {
    return deny(principalDenial);
  }

  const capability = request.capability;
  if (!capability || capability.key !== request.capabilityKey) {
    return deny('CAPABILITY_UNKNOWN');
  }
  if (capability.deprecated) {
    return deny('CAPABILITY_DEPRECATED');
  }

  const grantDenial = denyForGrant(request);
  if (grantDenial) {
    return deny(grantDenial);
  }

  const constraintDenial = denyForCapabilityConstraints(request, capability);
  if (constraintDenial) {
    return deny(constraintDenial);
  }

  if (request.rateLimitExceeded) {
    return deny('RATE_LIMITED');
  }

  if (capability.allowedScopeTypes.length === 0) {
    return deny('SCOPE_TYPE_NOT_ALLOWED');
  }

  const matchedScope = findMatchingScope(
    request.scopes,
    request.target,
    capability.allowedScopeTypes,
  );
  if (!matchedScope) {
    return deny('RESOURCE_OUT_OF_SCOPE');
  }

  if (capability.approval === 'REQUIRED' && !request.approvalGranted) {
    return { outcome: 'REQUIRE_APPROVAL', capability, matchedScope };
  }

  return { outcome: 'ALLOW', capability, matchedScope };
}
