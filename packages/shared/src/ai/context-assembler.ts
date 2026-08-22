import type { AiPolicyAllowDecision, AiPolicyDecision } from './policy-decision';
import {
  assertBoundAllowDecision,
  effectiveClassificationCeiling,
  isSourceCoveredByMatchedScope,
  type AiAuthorizationGateFailure,
} from './authorization-binding';
import { applyContextBudget, resolveContextBudget } from './context-budget';
import {
  contextTrustForSource,
  isClassificationAllowed,
  projectionContainsSecretFields,
  redactSecretShapedFields,
} from './context-classification';
import type {
  AiAssembledContext,
  AiAuthorizedContextSource,
  AiContextAssembleRequest,
  AiContextFragment,
} from './context-types';

export type AiContextAssembleFailure = AiAuthorizationGateFailure;

export type AiContextAssembleResult =
  | { ok: true; context: AiAssembledContext }
  | AiContextAssembleFailure;

/**
 * Assembles authorized, purpose-built projections. Does not fetch domain rows
 * and cannot run unless the caller already has an ALLOW decision.
 */
export function assembleAuthorizedContext(
  request: AiContextAssembleRequest,
): AiContextAssembleResult {
  const authorizationGate = assertBoundAllowDecision(
    request.actorId,
    request.actorType,
    request.authorization,
  );
  if (!authorizationGate.ok) {
    return authorizationGate;
  }

  const now = request.now ?? new Date();
  const retrievedAt = now.toISOString();
  const budget = resolveContextBudget(request.budget);
  const accepted: AiContextFragment[] = [];
  const omitted: AiAssembledContext['omitted'] = [];

  for (const source of request.sources) {
    const rejected = classifySourceRejection(source, request, authorizationGate.decision);
    if (rejected) {
      omitted.push(rejected);
      continue;
    }
    accepted.push(toFragment(source, request, retrievedAt, budget.maxAgeMs ?? null));
  }

  const budgeted = applyContextBudget(accepted, budget);
  return {
    ok: true,
    context: {
      fragments: budgeted.fragments,
      omitted: [...omitted, ...budgeted.omitted],
      budget: budgeted.budget,
    },
  };
}

export function assertAssemblyAuthorized(
  authorization: AiPolicyDecision,
): { ok: true } | AiContextAssembleFailure {
  if (authorization.outcome === 'DENY') {
    return { ok: false, reason: 'AUTHORIZATION_DENIED' };
  }
  if (authorization.outcome !== 'ALLOW') {
    return { ok: false, reason: 'AUTHORIZATION_REQUIRED' };
  }
  return { ok: true };
}

function classifySourceRejection(
  source: AiAuthorizedContextSource,
  request: AiContextAssembleRequest,
  authorization: AiPolicyAllowDecision,
): AiAssembledContext['omitted'][number] | null {
  if (source.accessBasis.capabilityKey !== authorization.capability.key) {
    return omit(source, 'UNAUTHORIZED');
  }
  if (!isSourceCoveredByMatchedScope(authorization.matchedScope, source.accessBasis)) {
    return omit(source, 'UNAUTHORIZED');
  }
  if (source.classification === 'SECRET' || projectionContainsSecretFields(source.projection)) {
    return omit(source, 'SECRET');
  }
  const ceiling = effectiveClassificationCeiling(
    request.maxDataClassification,
    authorization.capability.maxDataClassification,
  );
  if (!isClassificationAllowed(source.classification, ceiling)) {
    return omit(source, 'CLASSIFICATION');
  }
  return null;
}

function omit(
  source: AiAuthorizedContextSource,
  reason: AiAssembledContext['omitted'][number]['reason'],
): AiAssembledContext['omitted'][number] {
  return { sourceId: source.sourceId, sourceType: source.sourceType, reason };
}

function toFragment(
  source: AiAuthorizedContextSource,
  request: AiContextAssembleRequest,
  retrievedAt: string,
  maxAgeMs: number | null,
): AiContextFragment {
  const redacted = redactSecretShapedFields(source.projection);
  const sourceUpdatedAt = source.sourceUpdatedAt ?? null;
  const stale =
    maxAgeMs !== null &&
    sourceUpdatedAt !== null &&
    Date.parse(retrievedAt) - Date.parse(sourceUpdatedAt) > maxAgeMs;
  return {
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    projection: redacted.projection,
    provenance: {
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      retrievedAt,
      accessBasis: {
        actorId: request.actorId,
        actorType: request.actorType,
        capabilityKey: source.accessBasis.capabilityKey,
        scopeType: source.accessBasis.scopeType,
        scopeId: source.accessBasis.scopeId,
      },
      citation: source.citation,
    },
    freshness: {
      sourceUpdatedAt,
      retrievedAt,
      maxAgeMs,
      stale,
    },
    classification: {
      dataClassification: source.classification,
      redacted: redacted.redacted,
      redactionReason: redacted.redacted ? 'FIELD_ALLOWLIST' : undefined,
      trust: contextTrustForSource(source.sourceType),
    },
  };
}
