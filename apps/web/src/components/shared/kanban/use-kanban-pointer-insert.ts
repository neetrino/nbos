'use client';

import { useEffect, useState } from 'react';
import {
  findKanbanColumnList,
  isPointerInsideRect,
  KANBAN_COLUMN_DROP_ZONE_DATA_ATTR,
  resolveKanbanInsertIndex,
} from './kanban-insert-index';

export interface KanbanPointerInsert {
  columnKey: string;
  index: number;
}

/**
 * Tracks pointer Y over kanban column drop zones (full column body, not only card stacks).
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
    if (!active) return;

    const onPointerMove = (event: PointerEvent) => {
      for (const columnKey of columnKeys) {
        const dropZone = document.querySelector<HTMLElement>(
          `[${KANBAN_COLUMN_DROP_ZONE_DATA_ATTR}="${columnKey}"]`,
        );
        if (!dropZone) continue;

        const zoneRect = dropZone.getBoundingClientRect();
        if (!isPointerInsideRect(event.clientX, event.clientY, zoneRect)) continue;

        const list = findKanbanColumnList(dropZone);
        if (!list) continue;

        const excludeId = columnKey === sourceColumnKey ? excludeItemId : undefined;
        const index = resolveKanbanInsertIndex(list, event.clientY, excludeId, dropZone);
        setDropInsert({ columnKey, index });
        return;
      }
      setDropInsert(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [active, sourceColumnKey, columnKeys, excludeItemId]);

  return active ? dropInsert : null;
}
