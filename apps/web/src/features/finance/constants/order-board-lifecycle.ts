import type { BoardStageDefinition } from '@/features/shared/board-lifecycle';

/** Order payment-status columns for kanban scope (terminal = closed outcomes). */
export const ORDER_BOARD_STAGES: BoardStageDefinition[] = [
  { key: 'NEW' },
  { key: 'PREPAID' },
  { key: 'PARTIALLY_PAID' },
  { key: 'FULLY_PAID', terminal: true },
  { key: 'CLOSED', terminal: true },
  { key: 'CANCELLED', terminal: true },
];

export const ORDER_BOARD_COLUMN_ORDER = ORDER_BOARD_STAGES.map((stage) => stage.key);
