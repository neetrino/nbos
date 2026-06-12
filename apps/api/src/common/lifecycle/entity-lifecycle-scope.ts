import {
  type EntityLifecycleScope,
  type LifecycleTimestampField,
  isActiveScope,
  isTrashScope,
  parseEntityLifecycleScope,
} from '@nbos/shared';

export type TimestampScopeFilter = {
  [K in LifecycleTimestampField]?: null | { not: null };
};

/**
 * Builds a Prisma-friendly filter for a single nullable timestamp trash column.
 * Active → field IS NULL; Trash → field IS NOT NULL.
 */
export function buildTimestampScopeWhere(
  scope: EntityLifecycleScope,
  field: LifecycleTimestampField = 'trashedAt',
): TimestampScopeFilter {
  if (isActiveScope(scope)) {
    return { [field]: null };
  }
  if (isTrashScope(scope)) {
    return { [field]: { not: null } };
  }
  return { [field]: null };
}

/**
 * Profile-aware scope where. Prefer this entry point in module services.
 */
export function buildScopeWhere(
  scope: EntityLifecycleScope,
  options?: { field?: LifecycleTimestampField },
): TimestampScopeFilter {
  return buildTimestampScopeWhere(scope, options?.field ?? 'trashedAt');
}

/** Drive recoverable Trash rows (Profile B): soft-deleted with a trash timestamp. */
export function buildDriveRecoverableTrashWhere(): {
  status: 'DELETED';
  deletedAt: { not: null };
} {
  return {
    status: 'DELETED',
    deletedAt: { not: null },
  };
}

/** Merges Profile A list scope into an existing Prisma where clause. */
export function mergeProfileAListScope<T extends Record<string, unknown>>(
  where: T,
  scope: EntityLifecycleScope,
): T & ReturnType<typeof buildScopeWhere> {
  return { ...where, ...buildScopeWhere(scope) };
}

export function parseLifecycleScopeFromQuery(
  scopeParam?: string,
  legacyIncludeTrash?: boolean,
): EntityLifecycleScope {
  if (scopeParam != null && scopeParam.trim() !== '') {
    return parseEntityLifecycleScope(scopeParam);
  }
  if (legacyIncludeTrash === true) {
    return 'trash';
  }
  return 'active';
}

export { parseEntityLifecycleScope };
