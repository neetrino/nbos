/** Fixed kanban column width — Active and Closed boards use the same shell (canon: 288px). */
export const DELIVERY_KANBAN_COLUMN_WIDTH_PX = 288;

/** Horizontal margin on each column shell (`mx-2`). */
export const DELIVERY_KANBAN_COLUMN_GAP_PX = 16;

export const DELIVERY_KANBAN_COLUMN_SHELL_CLASS =
  'mx-2 flex h-full min-h-0 w-[288px] max-w-[288px] shrink-0 flex-col';

/** Scroll viewport — width constrained by parent; never set minWidth here. */
export const DELIVERY_KANBAN_BOARD_SCROLL_CLASS =
  'min-h-0 w-full min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-2';

/** Inner row that defines total board width. */
export const DELIVERY_KANBAN_BOARD_ROW_CLASS = 'flex h-full min-h-0 gap-0';

export function deliveryKanbanBoardMinWidthPx(columnCount: number): number {
  return columnCount * (DELIVERY_KANBAN_COLUMN_WIDTH_PX + DELIVERY_KANBAN_COLUMN_GAP_PX);
}
