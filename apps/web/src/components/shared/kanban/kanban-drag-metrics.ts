import { KANBAN_CARD_ROW_DATA_ATTR } from './kanban-insert-index';

/** Measured height of a kanban card row (drag source wrapper). */
export function measureKanbanCardRowHeight(element: HTMLElement): number | null {
  const height = Math.round(element.getBoundingClientRect().height);
  return height > 0 ? height : null;
}

/** Finds the visible card row for an item id (HTML5 and dnd-kit boards). */
export function findKanbanCardRowByItemId(itemId: string): HTMLElement | null {
  const escaped =
    typeof CSS !== 'undefined' && 'escape' in CSS
      ? CSS.escape(itemId)
      : itemId.replace(/"/g, '\\"');
  return document.querySelector<HTMLElement>(
    `[${KANBAN_CARD_ROW_DATA_ATTR}][data-item-id="${escaped}"]`,
  );
}
