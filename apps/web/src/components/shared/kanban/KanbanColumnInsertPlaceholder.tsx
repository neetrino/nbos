import { KanbanDropPlaceholder } from './KanbanDropPlaceholder';

/** Renders at most one drop silhouette for a column list slot. */
export function KanbanColumnInsertPlaceholder({
  insertIndex,
  itemCount,
  isDropTarget,
  heightPx,
}: {
  insertIndex: number | null;
  itemCount: number;
  isDropTarget: boolean;
  heightPx: number | null;
}) {
  if (!isDropTarget || insertIndex === null) return null;

  if (itemCount === 0 && insertIndex === 0) {
    return <KanbanDropPlaceholder heightPx={heightPx} />;
  }

  return null;
}

export function KanbanInsertPlaceholderBeforeItem({
  insertIndex,
  itemIdx,
  isDropTarget,
  heightPx,
}: {
  insertIndex: number | null;
  itemIdx: number;
  isDropTarget: boolean;
  heightPx: number | null;
}) {
  if (!isDropTarget || insertIndex === null || insertIndex !== itemIdx) return null;
  return <KanbanDropPlaceholder heightPx={heightPx} />;
}

export function KanbanInsertPlaceholderAfterList({
  insertIndex,
  itemCount,
  isDropTarget,
  heightPx,
}: {
  insertIndex: number | null;
  itemCount: number;
  isDropTarget: boolean;
  heightPx: number | null;
}) {
  if (!isDropTarget || insertIndex === null || itemCount === 0) return null;
  if (insertIndex !== itemCount) return null;
  return <KanbanDropPlaceholder heightPx={heightPx} />;
}
