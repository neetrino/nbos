import { AI_AUDIT_ENTITY } from '../ai-platform.constants';

/** Employee RBAC used by Settings → AI & Agents (same as Integrations). */
export const AI_ADMIN_PERMISSION_MODULE = 'COMPANY' as const;
export const AI_ADMIN_PERMISSION_ACTION = 'EDIT' as const;

export const AI_ADMIN_ROUTE_PREFIX = 'ai-admin';

export const AI_ADMIN_OVERVIEW_ACTIVITY_LIMIT = 8;

/** Entity types owned by AI Platform — used by the admin Activity view. */
export const AI_ADMIN_AUDIT_ENTITY_TYPES = [
  AI_AUDIT_ENTITY.agent,
  AI_AUDIT_ENTITY.credential,
  AI_AUDIT_ENTITY.capabilityGrant,
  AI_AUDIT_ENTITY.resourceScope,
  AI_AUDIT_ENTITY.capability,
  AI_AUDIT_ENTITY.providerConnection,
  AI_AUDIT_ENTITY.model,
  AI_AUDIT_ENTITY.modelPolicy,
  AI_AUDIT_ENTITY.internalAgent,
  AI_AUDIT_ENTITY.internalCapabilityGrant,
  AI_AUDIT_ENTITY.internalResourceScope,
] as const;
