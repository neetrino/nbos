export const KANBAN_COLUMN_DROP_ZONE_DATA_ATTR = 'data-kanban-column-drop';
export const KANBAN_COLUMN_LIST_DATA_ATTR = 'data-kanban-column-list';
export const KANBAN_CARD_ROW_DATA_ATTR = 'data-kanban-card-row';

/** Index in [0, rowCount] where a dropped card should be inserted. */
export function resolveKanbanInsertIndex(
  listRoot: HTMLElement,
  clientY: number,
  excludeItemId?: string,
  dropZoneRoot?: HTMLElement | null,
): number {
  const rows = Array.from(
    listRoot.querySelectorAll<HTMLElement>(`[${KANBAN_CARD_ROW_DATA_ATTR}]`),
  ).filter((row) => row.dataset.itemId !== excludeItemId);

  if (rows.length === 0) return 0;

  const firstRow = rows[0];
  if (firstRow && clientY < firstRow.getBoundingClientRect().top) {
    return 0;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const { top, height } = row.getBoundingClientRect();
    if (clientY < top + height / 2) return i;
  }

  return rows.length;
}

export function isPointerInsideRect(
  clientX: number,
  clientY: number,
  rect: DOMRectReadOnly,
): boolean {
  return (
    clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  );
}

export function findKanbanColumnList(dropZone: HTMLElement): HTMLElement | null {
  return dropZone.querySelector<HTMLElement>(`[${KANBAN_COLUMN_LIST_DATA_ATTR}]`);
}
