import { ORDER_BOARD_STAGES } from '@/features/finance/constants/order-board-lifecycle';

export type OrderBoardColumnStatus = (typeof ORDER_BOARD_STAGES)[number]['key'];

/** Kanban stage colors (shared `KanbanBoard` header bars). */
export const ORDER_BOARD_STAGE_COLORS: Record<OrderBoardColumnStatus, string> = {
  NEW: 'bg-blue-500',
  PREPAID: 'bg-amber-500',
  PARTIALLY_PAID: 'bg-orange-500',
  FULLY_PAID: 'bg-green-500',
  CLOSED: 'bg-indigo-500',
  CANCELLED: 'bg-red-500',
};

export const ORDER_BOARD_COLUMN_WIDTH = 270;
export const ORDER_BOARD_COLUMN_WIDTH_CLOSED = 288;
