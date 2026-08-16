import type { BoardStageDefinition } from '@/features/shared/board-lifecycle';

/**
 * Order payment-status columns — keys must match `OrderStatusEnum` in Prisma.
 * Terminal = closed board scope outcomes.
 */
export const ORDER_BOARD_STAGES: BoardStageDefinition[] = [
  { key: 'PENDING_PAYMENT' },
  { key: 'ACTIVE' },
  { key: 'PARTIALLY_PAID' },
  { key: 'FULLY_PAID', terminal: true },
  { key: 'CLOSED', terminal: true },
];

export const ORDER_BOARD_COLUMN_ORDER = ORDER_BOARD_STAGES.map((stage) => stage.key);
