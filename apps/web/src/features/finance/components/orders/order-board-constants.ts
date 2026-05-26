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

export const ORDER_BOARD_LANE_HEADER_CLASS: Record<OrderBoardColumnStatus, string> = {
  NEW: 'bg-blue-100/90 dark:bg-blue-900/35',
  PREPAID: 'bg-amber-100/90 dark:bg-amber-900/35',
  PARTIALLY_PAID: 'bg-orange-100/90 dark:bg-orange-900/35',
  FULLY_PAID: 'bg-green-100/90 dark:bg-green-900/35',
  CLOSED: 'bg-muted/60',
  CANCELLED: 'bg-red-100/90 dark:bg-red-900/35',
};
