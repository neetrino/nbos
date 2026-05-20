import {
  matchesBoardLifecycleScope,
  type BoardLifecycleScope,
  type BoardStageDefinition,
} from '@/features/shared/board-lifecycle';

/** Product Hub / delivery board product status columns (terminal = closed outcomes). */
export const PRODUCT_BOARD_STAGES: readonly BoardStageDefinition[] = [
  { key: 'NEW' },
  { key: 'CREATING' },
  { key: 'DEVELOPMENT' },
  { key: 'QA' },
  { key: 'TRANSFER' },
  { key: 'DONE', terminal: true },
  { key: 'LOST', terminal: true },
] as const;

export function productMatchesProductBoardScope(
  status: string,
  scope: BoardLifecycleScope,
): boolean {
  return matchesBoardLifecycleScope(status, PRODUCT_BOARD_STAGES, scope);
}
