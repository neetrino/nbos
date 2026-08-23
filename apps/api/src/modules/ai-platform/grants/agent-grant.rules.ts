import { BadRequestException } from '@nestjs/common';
import { PLATFORM_ORGANIZATION_SCOPE_ID, type AiScopeType } from '@nbos/shared';
import { AGENT_GRANT_REASON_MAX_LENGTH } from '../ai-platform.constants';

export function normalizeGrantReason(reason: string | null | undefined): string | null {
  const trimmed = reason?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > AGENT_GRANT_REASON_MAX_LENGTH) {
    throw new BadRequestException(`reason exceeds ${AGENT_GRANT_REASON_MAX_LENGTH} characters`);
  }
  return trimmed;
}

/**
 * Resolves the stored `scopeId`. ORGANIZATION scope carries the platform
 * sentinel so the column stays NOT NULL and the uniqueness index holds.
 */
export function resolveScopeId(scopeType: AiScopeType, scopeId: string | null | undefined): string {
  if (scopeType === 'ORGANIZATION') {
    return PLATFORM_ORGANIZATION_SCOPE_ID;
  }
  const trimmed = scopeId?.trim();
  if (!trimmed) {
    throw new BadRequestException(`scopeId is required for ${scopeType} scope`);
  }
  return trimmed;
}

/**
 * RESOURCE scopes are identified by type *and* id, so `TASK:123` and `FILE:123`
 * are different grants. Non-resource scopes store an empty string, which keeps
 * the column NOT NULL and the uniqueness key total.
 */
export function resolveScopeResourceType(
  scopeType: AiScopeType,
  resourceType: string | null | undefined,
): string {
  if (scopeType !== 'RESOURCE') {
    return '';
  }
  const trimmed = resourceType?.trim().toUpperCase();
  if (!trimmed) {
    throw new BadRequestException('resourceType is required for RESOURCE scope');
  }
  return trimmed;
}
