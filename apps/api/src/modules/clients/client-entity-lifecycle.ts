import type { EntityLifecycleScope } from '@nbos/shared';
import { buildScopeWhere } from '../../common/lifecycle/entity-lifecycle-scope';

const TRASH_FIELD = 'trashedAt' as const;

/** Merges Profile A list scope into an existing Prisma where clause. */
export function mergeClientListScope<T extends Record<string, unknown>>(
  where: T,
  scope: EntityLifecycleScope,
): T & ReturnType<typeof buildScopeWhere> {
  return { ...where, ...buildScopeWhere(scope, { field: TRASH_FIELD }) };
}
