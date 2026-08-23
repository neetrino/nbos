import type { ActorType } from '../actor';
import { matchesGrantedScope, type AgentGrantedScope, type AiResourceTarget } from './agent-scope';
import {
  isDataClassificationWithin,
  type AiDataClassification,
  type AiScopeType,
} from './capability-types';
import type { AiPolicyAllowDecision, AiPolicyDecision } from './policy-decision';

export type AiAuthorizationGateFailure = {
  ok: false;
  reason: 'AUTHORIZATION_DENIED' | 'AUTHORIZATION_REQUIRED';
};

export interface AiAccessBasisScope {
  scopeType?: string;
  scopeId?: string;
  resourceType?: string | null;
  resourceId?: string | null;
}

/**
 * ALLOW is usable only for the actor who received it. A replayed decision
 * with another actorId is authorization failure, not a source omit.
 */
export function assertBoundAllowDecision(
  actorId: string,
  actorType: ActorType,
  authorization: AiPolicyDecision,
): { ok: true; decision: AiPolicyAllowDecision } | AiAuthorizationGateFailure {
  if (authorization.outcome === 'DENY') {
    return { ok: false, reason: 'AUTHORIZATION_DENIED' };
  }
  if (authorization.outcome !== 'ALLOW') {
    return { ok: false, reason: 'AUTHORIZATION_REQUIRED' };
  }
  if (authorization.actorId !== actorId || authorization.actorType !== actorType) {
    return { ok: false, reason: 'AUTHORIZATION_DENIED' };
  }
  return { ok: true, decision: authorization };
}

/** Missing scope never widens. ORGANIZATION grants still require a declared source scope. */
export function isSourceCoveredByMatchedScope(
  matchedScope: AgentGrantedScope,
  access: AiAccessBasisScope,
): boolean {
  if (!access.scopeType || !access.scopeId) {
    return false;
  }
  const target = accessBasisToResourceTarget(access);
  return target !== null && matchesGrantedScope(matchedScope, target);
}

export function accessBasisToResourceTarget(access: AiAccessBasisScope): AiResourceTarget | null {
  if (!access.scopeType || !access.scopeId) {
    return null;
  }
  switch (access.scopeType as AiScopeType) {
    case 'WORKSPACE':
      return {
        workspaceId: access.scopeId,
        resourceType: access.resourceType,
        resourceId: access.resourceId,
      };
    case 'PRODUCT':
      return {
        productId: access.scopeId,
        resourceType: access.resourceType,
        resourceId: access.resourceId,
      };
    case 'PROJECT':
      return {
        projectId: access.scopeId,
        resourceType: access.resourceType,
        resourceId: access.resourceId,
      };
    case 'RESOURCE':
      return {
        resourceType: access.resourceType ?? undefined,
        resourceId: access.resourceId ?? access.scopeId,
      };
    case 'ORGANIZATION':
      return { resourceType: access.resourceType, resourceId: access.resourceId };
    default:
      return null;
  }
}

/** The tighter of the request ceiling and the capability ceiling. */
export function effectiveClassificationCeiling(
  requestCeiling: AiDataClassification,
  capabilityCeiling: AiDataClassification,
): AiDataClassification {
  return isDataClassificationWithin(requestCeiling, capabilityCeiling)
    ? requestCeiling
    : capabilityCeiling;
}
