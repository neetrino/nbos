import type { BoardStageDefinition } from '@/features/shared/board-lifecycle';

/** Support ticket workflow columns for board scope filtering. */
export const SUPPORT_TICKET_BOARD_STAGES: BoardStageDefinition[] = [
  { key: 'NEW' },
  { key: 'TRIAGED' },
  { key: 'ASSIGNED' },
  { key: 'IN_PROGRESS' },
  { key: 'RESOLVED', terminal: true },
  { key: 'CLOSED', terminal: true },
];
