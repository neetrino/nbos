import { AI_ADMIN_ACTIVITY_PAGE_SIZE } from './constants';

export interface AiAdminActivityPageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const EMPTY_ACTIVITY_META: AiAdminActivityPageMeta = {
  total: 0,
  page: 1,
  pageSize: AI_ADMIN_ACTIVITY_PAGE_SIZE,
  totalPages: 0,
};

export interface AiAdminActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { displayName?: string | null; type?: string | null } | null;
}

export function asActivityItems(value: unknown): AiAdminActivityItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isActivityItem);
}

function isActivityItem(value: unknown): value is AiAdminActivityItem {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.action === 'string' &&
    typeof row.entityType === 'string' &&
    typeof row.entityId === 'string'
  );
}
