import type { BoardStageDefinition } from '@/features/shared/board-lifecycle';

/** Invoice money-status columns for kanban scope (terminal = closed outcomes). */
export const INVOICE_MONEY_BOARD_STAGES: BoardStageDefinition[] = [
  { key: 'NEW' },
  { key: 'AWAITING_PAYMENT' },
  { key: 'OVERDUE' },
  { key: 'ON_HOLD' },
  { key: 'PAID', terminal: true },
  { key: 'CANCELLED', terminal: true },
];
