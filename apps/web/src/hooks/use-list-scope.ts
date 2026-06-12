'use client';

import { useCallback, useState } from 'react';
import { type EntityLifecycleScope, parseEntityLifecycleScope } from '@nbos/shared';

export interface UseListScopeOptions {
  initialScope?: EntityLifecycleScope;
  /** Called when scope changes (R2: reset folderId, projectId, open sheet, etc.). */
  onScopeChange?: (scope: EntityLifecycleScope) => void;
}

/**
 * Shared list scope state for Profile A/B/C views (R1–R2).
 * Keeps one `active | trash` scope per screen and resets navigation on change.
 */
export function useListScope(options: UseListScopeOptions = {}) {
  const { initialScope = 'active', onScopeChange } = options;
  const [scope, setScopeState] = useState<EntityLifecycleScope>(initialScope);

  const setScope = useCallback(
    (next: EntityLifecycleScope) => {
      setScopeState((current) => {
        if (current === next) return current;
        onScopeChange?.(next);
        return next;
      });
    },
    [onScopeChange],
  );

  const setScopeFromQuery = useCallback(
    (raw: string | null | undefined) => {
      setScope(parseEntityLifecycleScope(raw, scope));
    },
    [scope, setScope],
  );

  const isTrashView = scope === 'trash';
  const isActiveView = scope === 'active';

  return {
    scope,
    setScope,
    setScopeFromQuery,
    isTrashView,
    isActiveView,
  };
}
