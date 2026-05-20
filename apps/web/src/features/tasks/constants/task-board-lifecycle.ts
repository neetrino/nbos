import {
  matchesBoardLifecycleScope,
  type BoardLifecycleScope,
  type BoardStageDefinition,
} from '@/features/shared/board-lifecycle';

/** Persisted task statuses for board scope (NEW/DONE normalized at match time). */
export const TASK_BOARD_STAGES: BoardStageDefinition[] = [
  { key: 'OPEN' },
  { key: 'IN_PROGRESS' },
  { key: 'REVIEW' },
  { key: 'ON_HOLD' },
  { key: 'COMPLETED', terminal: true },
];

export function normalizeTaskStatusForBoardScope(status: string): string {
  if (status === 'NEW') return 'OPEN';
  if (status === 'DONE') return 'COMPLETED';
  return status;
}

export function taskMatchesTaskBoardScope(status: string, scope: BoardLifecycleScope): boolean {
  return matchesBoardLifecycleScope(
    normalizeTaskStatusForBoardScope(status),
    TASK_BOARD_STAGES,
    scope,
  );
}
