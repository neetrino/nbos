/** Payment pipeline columns for the orders board (left → right). */
export const ORDER_BOARD_COLUMN_ORDER = [
  'NEW',
  'PREPAID',
  'PARTIALLY_PAID',
  'FULLY_PAID',
  'CLOSED',
  'CANCELLED',
] as const;

export type OrderBoardColumnStatus = (typeof ORDER_BOARD_COLUMN_ORDER)[number];

/** Kanban stage colors (shared `KanbanBoard` header bars). */
export const ORDER_BOARD_STAGE_COLORS: Record<OrderBoardColumnStatus, string> = {
  NEW: 'bg-blue-500',
  PREPAID: 'bg-amber-500',
  PARTIALLY_PAID: 'bg-orange-500',
  FULLY_PAID: 'bg-green-500',
  CLOSED: 'bg-gray-400',
  CANCELLED: 'bg-red-500',
};

export const ORDER_BOARD_COLUMN_WIDTH = 270;
