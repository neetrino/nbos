import type { ActorType } from '../actor';
import type { AiDataClassification, AiScopeType } from './capability-types';
import type { AiPolicyDecision } from './policy-decision';
import {
  assertBoundAllowDecision,
  effectiveClassificationCeiling,
  isSourceCoveredByMatchedScope,
} from './authorization-binding';
import { isClassificationAllowed } from './context-classification';
import type { AiContextFragment } from './context-types';

export const AI_KNOWLEDGE_SOURCE_KINDS = [
  'DOCUMENTS',
  'DRIVE',
  'CRM',
  'TASKS',
  'MESSENGER_FAQ',
  'REPORTS',
  'CURATED',
] as const;

export type AiKnowledgeSourceKind = (typeof AI_KNOWLEDGE_SOURCE_KINDS)[number];

export interface AiKnowledgeSource {
  sourceType: AiKnowledgeSourceKind;
  sourceId: string;
  requiredCapability: string;
  classification: AiDataClassification;
  scopeType: AiScopeType;
  scopeId: string;
  resourceType?: string | null;
}

export interface AiKnowledgeRetrieveRequest {
  actorId: string;
  actorType: ActorType;
  authorization: AiPolicyDecision;
  source: AiKnowledgeSource;
  /** Untrusted user/customer query. Never used for authorization. */
  query: string;
  maxDataClassification?: AiDataClassification;
}

export type AiKnowledgeDenial =
  | 'AUTHORIZATION_DENIED'
  | 'AUTHORIZATION_REQUIRED'
  | 'CAPABILITY_MISMATCH'
  | 'RESOURCE_OUT_OF_SCOPE'
  | 'SECRET_FORBIDDEN'
  | 'DATA_CLASSIFICATION_FORBIDDEN'
  | 'KNOWLEDGE_RETRIEVAL_DISABLED';

export type AiKnowledgeRetrieveResult =
  | { ok: true; fragments: AiContextFragment[] }
  | { ok: false; reason: AiKnowledgeDenial };

export function assertKnowledgeRetrievalAllowed(
  request: AiKnowledgeRetrieveRequest,
): AiKnowledgeRetrieveResult {
  const authorization = assertBoundAllowDecision(
    request.actorId,
    request.actorType,
    request.authorization,
  );
  if (!authorization.ok) {
    return authorization;
  }
  const denied = classifyKnowledgeRejection(request, authorization.decision.capability.key);
  if (denied) {
    return denied;
  }
  if (
    !isSourceCoveredByMatchedScope(authorization.decision.matchedScope, {
      scopeType: request.source.scopeType,
      scopeId: request.source.scopeId,
      resourceType: request.source.resourceType,
    })
  ) {
    return { ok: false, reason: 'RESOURCE_OUT_OF_SCOPE' };
  }
  return classifyKnowledgeSensitivity(
    request,
    authorization.decision.capability.maxDataClassification,
  );
}

/**
 * Future RAG entry point. Authorization is checked first; Phase 1 then refuses
 * retrieval. There is no unauthenticated retrieve function.
 */
export function retrieveKnowledgeDisabled(
  request: AiKnowledgeRetrieveRequest,
): AiKnowledgeRetrieveResult {
  const allowed = assertKnowledgeRetrievalAllowed(request);
  if (!allowed.ok) {
    return allowed;
  }
  return { ok: false, reason: 'KNOWLEDGE_RETRIEVAL_DISABLED' };
}

export function isAiKnowledgeSourceKind(value: string): value is AiKnowledgeSourceKind {
  return (AI_KNOWLEDGE_SOURCE_KINDS as readonly string[]).includes(value);
}

function classifyKnowledgeRejection(
  request: AiKnowledgeRetrieveRequest,
  grantedCapability: string,
): AiKnowledgeRetrieveResult | null {
  if (grantedCapability !== request.source.requiredCapability) {
    return { ok: false, reason: 'CAPABILITY_MISMATCH' };
  }
  return null;
}

function classifyKnowledgeSensitivity(
  request: AiKnowledgeRetrieveRequest,
  capabilityCeiling: AiDataClassification,
): AiKnowledgeRetrieveResult {
  if (request.source.classification === 'SECRET') {
    return { ok: false, reason: 'SECRET_FORBIDDEN' };
  }
  const ceiling = effectiveClassificationCeiling(
    request.maxDataClassification ?? capabilityCeiling,
    capabilityCeiling,
  );
  if (!isClassificationAllowed(request.source.classification, ceiling)) {
    return { ok: false, reason: 'DATA_CLASSIFICATION_FORBIDDEN' };
  }
  return { ok: true, fragments: [] };
}
