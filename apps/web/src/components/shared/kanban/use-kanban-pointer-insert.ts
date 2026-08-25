'use client';

import { useEffect, useState } from 'react';
import { resolveKanbanPointerInsert, type KanbanPointerInsert } from './kanban-insert-index';

export type { KanbanPointerInsert };

/**
 * Tracks pointer Y over kanban column drop zones (full column body, not only card stacks).
 */
export function useKanbanPointerInsert(options: {
  active: boolean;
  sourceColumnKey: string | null;
  columnKeys: readonly string[];
  excludeItemId?: string;
}): KanbanPointerInsert | null {
  const { active, sourceColumnKey, columnKeys, excludeItemId } = options;
  const [dropInsert, setDropInsert] = useState<KanbanPointerInsert | null>(null);

  useEffect(() => {
    if (!active) return;

    const onPointerMove = (event: PointerEvent) => {
      setDropInsert(
        resolveKanbanPointerInsert(event.clientX, event.clientY, {
          columnKeys,
          sourceColumnKey,
          excludeItemId,
        }),
      );
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true, capture: true });
    return () => window.removeEventListener('pointermove', onPointerMove, { capture: true });
  }, [active, sourceColumnKey, columnKeys, excludeItemId]);

  return active ? dropInsert : null;
}
