import { reorderItemsInColumn } from '@/components/shared/kanban/kanban-reorder';
import type { KanbanColumn } from '@/components/shared/kanban/kanban.types';
import {
  buildTerminalDropZones as buildTerminalDropZonesShared,
  shouldShowTerminalDropBar,
  type TerminalDropStageSource,
} from '@/features/shared/kanban-terminal-drop';
import {
  getBoardStageKeys,
  resolveBoardLifecycleScope,
  type BoardStageDefinition,
} from '@/features/shared/board-lifecycle';

interface StageMeta extends BoardStageDefinition, TerminalDropStageSource {
  color: string;
  hexColor?: string;
}

export function buildScopedKanbanColumns<T extends { status: string }>({
  items,
  stages,
  scopeValue,
  columnMeta,
}: {
  items: T[];
  stages: readonly StageMeta[];
  scopeValue: string | undefined;
  columnMeta?: Record<string, { totalCount?: number; hasMore?: boolean; loadingMore?: boolean }>;
}): KanbanColumn<T>[] {
  const scope = resolveBoardLifecycleScope(scopeValue);
  const visibleKeys = getBoardStageKeys(stages, scope);
  return visibleKeys.map((key) => {
    const stage = stages.find((row) => row.key === key);
    const meta = columnMeta?.[key];
    return {
      key,
      label: stage?.label ?? key,
      color: stage?.color ?? 'bg-muted',
      hexColor: stage?.hexColor,
      items: items.filter((item) => item.status === key),
      totalCount: meta?.totalCount,
      hasMore: meta?.hasMore,
      loadingMore: meta?.loadingMore,
    };
  });
}

export function buildTerminalDropZones(stages: readonly StageMeta[]) {
  return buildTerminalDropZonesShared(stages);
}

export { shouldShowTerminalDropBar };

/** Local kanban order within one CRM stage column (lead/deal status). */
export function reorderCrmKanbanColumn<T extends { id: string; status: string }>(
  items: T[],
  itemId: string,
  columnKey: string,
  toIndex: number,
): T[] {
  return reorderItemsInColumn(
    items,
    itemId,
    toIndex,
    (item) => item.status === columnKey,
    (item) => item.id,
  );
}
