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
export const AUDIT_MAX_PAGE_SIZE = 100;
export const AUDIT_LOG_PAGE_ORDER = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

export function normalizeAuditPagination(pagination: PaginationParams): {
  page: number;
  pageSize: number;
} {
  const page =
    typeof pagination.page === 'number' && Number.isInteger(pagination.page) && pagination.page >= 1
      ? pagination.page
      : AUDIT_DEFAULT_PAGE;
  const requested = pagination.pageSize;
  const pageSize =
    typeof requested === 'number' && Number.isInteger(requested) && requested >= 1
      ? Math.min(requested, AUDIT_MAX_PAGE_SIZE)
      : AUDIT_DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}
