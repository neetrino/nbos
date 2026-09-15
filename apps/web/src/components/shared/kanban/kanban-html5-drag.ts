import { isReorderNoop, mapFilteredInsertToFullIndex } from './kanban-reorder';

/** Cards, headers and edge chrome must not steal HTML5 drop hits while dragging. */
export const KANBAN_HTML5_DRAG_IGNORE_POINTER_CLASS = 'pointer-events-none';

export type KanbanHtml5DragItem = {
  id: string;
  fromColumn: string;
};

export type KanbanHtml5Insert = {
  columnKey: string;
  index: number;
};

export type KanbanHtml5DropPlan =
  | { kind: 'move'; itemId: string; fromColumn: string; toColumn: string; toIndex: number }
  | { kind: 'reorder'; itemId: string; columnKey: string; toIndex: number }
  | { kind: 'noop' };

/**
 * Safari/Firefox skip `drop` unless `dragstart` writes to `dataTransfer`.
 */
export function prepareKanbanHtml5Drag(dataTransfer: DataTransfer | null, itemId: string): void {
  if (!dataTransfer) return;
  dataTransfer.setData('text/plain', itemId);
  dataTransfer.effectAllowed = 'move';
}

export function allowKanbanHtml5Drop(dataTransfer: DataTransfer | null): void {
  if (!dataTransfer) return;
  dataTransfer.dropEffect = 'move';
}

export function isSameKanbanInsert(
  current: KanbanHtml5Insert | null,
  columnKey: string,
  index: number,
): boolean {
  return current?.columnKey === columnKey && current.index === index;
}

/**
 * Resolve a column drop. Uses the last `dragover` insert index so `dragend` can
 * still commit when the browser never fires `drop` (common over nested cards).
 */
export function planKanbanHtml5Drop<T>(input: {
  dragItem: KanbanHtml5DragItem;
  toColumn: string;
  filteredInsert: number;
  columnItems: T[];
  getItemId: (item: T) => string;
}): KanbanHtml5DropPlan {
  const { dragItem, toColumn, filteredInsert, columnItems, getItemId } = input;

  if (dragItem.fromColumn === toColumn) {
    return planSameColumnDrop(dragItem.id, toColumn, filteredInsert, columnItems, getItemId);
  }

  return {
    kind: 'move',
    itemId: dragItem.id,
    fromColumn: dragItem.fromColumn,
    toColumn,
    toIndex: filteredInsert,
  };
}

function planSameColumnDrop<T>(
  itemId: string,
  columnKey: string,
  filteredInsert: number,
  columnItems: T[],
  getItemId: (item: T) => string,
): KanbanHtml5DropPlan {
  const fromIndex = columnItems.findIndex((item) => getItemId(item) === itemId);
  if (fromIndex < 0) return { kind: 'noop' };

  const toIndex = mapFilteredInsertToFullIndex(fromIndex, filteredInsert);
  if (isReorderNoop(fromIndex, toIndex)) return { kind: 'noop' };

  return { kind: 'reorder', itemId, columnKey, toIndex };
}
