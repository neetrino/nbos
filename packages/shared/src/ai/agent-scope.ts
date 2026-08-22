import type { AiScopeType } from './capability-types';

/**
 * NBOS is single-tenant, so ORGANIZATION scope has no organization row to point
 * at. This sentinel keeps `scopeId` NOT NULL, which in turn lets the unique
 * index on (agent, scopeType, scopeId, resourceType) actually hold — Postgres
 * treats NULLs as distinct and would otherwise allow duplicate grants.
 */
export const PLATFORM_ORGANIZATION_SCOPE_ID = 'PLATFORM';

export interface AgentGrantedScope {
  scopeType: AiScopeType;
  scopeId: string;
  resourceType?: string | null;
}

/**
 * Where the requested resource actually lives, already resolved by the calling
 * module (Extension Work Spaces resolve to their parent Product Work Space).
 * Absent fields never match a scope.
 */
export interface AiResourceTarget {
  workspaceId?: string | null;
  productId?: string | null;
  projectId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
}

function matchesId(scopeId: string, targetId: string | null | undefined): boolean {
  return Boolean(targetId) && scopeId === targetId;
}

/** Deny-by-default scope match. Never widens on missing target data. */
export function matchesGrantedScope(scope: AgentGrantedScope, target: AiResourceTarget): boolean {
  if (!scope.scopeId) {
    return false;
  }
  switch (scope.scopeType) {
    case 'ORGANIZATION':
      return scope.scopeId === PLATFORM_ORGANIZATION_SCOPE_ID;
    case 'PROJECT':
      return matchesId(scope.scopeId, target.projectId);
    case 'PRODUCT':
      return matchesId(scope.scopeId, target.productId);
    case 'WORKSPACE':
      return matchesId(scope.scopeId, target.workspaceId);
    case 'RESOURCE':
      return (
        Boolean(scope.resourceType) &&
        scope.resourceType === target.resourceType &&
        matchesId(scope.scopeId, target.resourceId)
      );
    default:
      return false;
  }
}

/**
 * First scope that both the capability allows and the target satisfies.
 * A capability grant alone never implies a resource, and a scope alone never
 * implies an action.
 */
export function findMatchingScope(
  scopes: readonly AgentGrantedScope[],
  target: AiResourceTarget,
  allowedScopeTypes: readonly AiScopeType[],
): AgentGrantedScope | null {
  for (const scope of scopes) {
    if (!allowedScopeTypes.includes(scope.scopeType)) {
      continue;
    }
    if (matchesGrantedScope(scope, target)) {
      return scope;
    }
  }
  return null;
}
