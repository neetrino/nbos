import { KANBAN_BOARD_SCROLL_CLASS } from '@/components/shared/kanban/kanban-scroll-classes';

/** Desktop kanban column width — Active and Closed boards use the same shell (canon: 288px). */
export const DELIVERY_KANBAN_COLUMN_WIDTH_PX = 288;

/** Horizontal margin on each column shell (`mx-2`). */
export const DELIVERY_KANBAN_COLUMN_GAP_PX = 16;

export const DELIVERY_KANBAN_COLUMN_SHELL_CLASS =
  'relative mx-2 flex h-full min-h-0 shrink-0 flex-col';

/** Same horizontal scroller as CRM `KanbanBoard`. */
export const DELIVERY_KANBAN_BOARD_SCROLL_CLASS = KANBAN_BOARD_SCROLL_CLASS;

/** Inner row that defines total board width. */
export const DELIVERY_KANBAN_BOARD_ROW_CLASS = 'flex h-full min-h-0 gap-0';

export function deliveryKanbanBoardMinWidthPx(
  columnCount: number,
  columnWidthPx = DELIVERY_KANBAN_COLUMN_WIDTH_PX,
): number {
  return columnCount * (columnWidthPx + DELIVERY_KANBAN_COLUMN_GAP_PX);
}
