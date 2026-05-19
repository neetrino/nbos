import { reorderItemsInColumn } from '@/components/shared/kanban/kanban-reorder';
import type { KanbanColumn, KanbanTerminalDropZone } from '@/components/shared/kanban/kanban.types';
import {
  getBoardStageKeys,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
  type BoardStageDefinition,
} from '@/features/shared/board-lifecycle';

interface StageMeta extends BoardStageDefinition {
  label: string;
  color: string;
}

export function buildScopedKanbanColumns<T extends { status: string }>({
  items,
  stages,
  scopeValue,
}: {
  items: T[];
  stages: readonly StageMeta[];
  scopeValue: string | undefined;
}): KanbanColumn<T>[] {
  const scope = resolveBoardLifecycleScope(scopeValue);
  const visibleKeys = getBoardStageKeys(stages, scope);
  return visibleKeys.map((key) => {
    const stage = stages.find((row) => row.key === key);
    return {
      key,
      label: stage?.label ?? key,
      color: stage?.color ?? 'bg-muted',
      items: items.filter((item) => item.status === key),
    };
  });
}

export function buildTerminalDropZones(stages: readonly StageMeta[]): KanbanTerminalDropZone[] {
  return stages
    .filter((stage) => stage.terminal)
    .map((stage) => ({
      key: stage.key,
      label: stage.label,
      tone: terminalTone(stage.key),
    }));
}

function terminalTone(statusKey: string): KanbanTerminalDropZone['tone'] {
  if (statusKey === 'FAILED' || statusKey === 'SPAM') return 'danger';
  if (statusKey === 'WON' || statusKey === 'SQL') return 'success';
  return 'neutral';
}

export function shouldShowTerminalDropBar(scopeValue: string | undefined): boolean {
  const scope: BoardLifecycleScope = resolveBoardLifecycleScope(scopeValue);
  return scope === 'ACTIVE';
}

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
