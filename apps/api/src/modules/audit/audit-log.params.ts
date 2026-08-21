import type { InputJsonValue } from '@nbos/database';
import type { ActorContext, ActorContextInput } from '@nbos/shared';

export interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: string;
  /** Legacy human path. Prefer `actor`. */
  userId?: string;
  actor?: ActorContext | ActorContextInput;
  projectId?: string;
  changes?: InputJsonValue;
  ipAddress?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export const AUDIT_DEFAULT_PAGE = 1;
export const AUDIT_DEFAULT_PAGE_SIZE = 20;
