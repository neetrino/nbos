'use client';

import { useEffect, useState } from 'react';
import {
  isPointerInsideRect,
  KANBAN_COLUMN_LIST_DATA_ATTR,
  resolveKanbanInsertIndex,
} from './kanban-insert-index';

export interface KanbanPointerInsert {
  columnKey: string;
  index: number;
}

/**
 * Tracks pointer Y over kanban column lists to position the drop placeholder between cards.
 */
export function useKanbanPointerInsert(options: {
  active: boolean;
  sourceColumnKey: string | null;
  columnKeys: string[];
  excludeItemId?: string;
}): KanbanPointerInsert | null {
  const { active, sourceColumnKey, columnKeys, excludeItemId } = options;
  const [dropInsert, setDropInsert] = useState<KanbanPointerInsert | null>(null);

  useEffect(() => {
    if (!active) {
      setDropInsert(null);
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      for (const columnKey of columnKeys) {
        const list = document.querySelector<HTMLElement>(
          `[${KANBAN_COLUMN_LIST_DATA_ATTR}="${columnKey}"]`,
        );
        if (!list) continue;

        const rect = list.getBoundingClientRect();
        if (!isPointerInsideRect(event.clientX, event.clientY, rect)) continue;

        const excludeId = columnKey === sourceColumnKey ? excludeItemId : undefined;
        const index = resolveKanbanInsertIndex(list, event.clientY, excludeId);
        setDropInsert({ columnKey, index });
        return;
      }
      setDropInsert(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [active, sourceColumnKey, columnKeys, excludeItemId]);

  return dropInsert;
}
