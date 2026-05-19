/** Board list scope: active pipeline vs closed outcomes vs everything. */
export type BoardLifecycleScope = 'ACTIVE' | 'CLOSED' | 'ALL';

/** Default board view (active pipeline only) — not stored as a filter until user changes scope. */
export const DEFAULT_BOARD_LIFECYCLE_SCOPE: BoardLifecycleScope = 'ACTIVE';

export const BOARD_LIFECYCLE_SCOPE_OPTIONS: Array<{
  value: BoardLifecycleScope;
  label: string;
}> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
];

export interface BoardStageDefinition {
  key: string;
  terminal?: boolean;
}

export function isTerminalBoardStage(stage: BoardStageDefinition): boolean {
  return Boolean(stage.terminal);
}

export function getBoardStageKeys(
  stages: readonly BoardStageDefinition[],
  scope: BoardLifecycleScope,
): string[] {
  if (scope === 'ACTIVE') {
    return stages.filter((stage) => !isTerminalBoardStage(stage)).map((stage) => stage.key);
  }
  if (scope === 'CLOSED') {
    return stages.filter((stage) => isTerminalBoardStage(stage)).map((stage) => stage.key);
  }
  return stages.map((stage) => stage.key);
}

export function matchesBoardLifecycleScope(
  status: string,
  stages: readonly BoardStageDefinition[],
  scope: BoardLifecycleScope,
): boolean {
  if (scope === 'ALL') return true;
  const keys = getBoardStageKeys(stages, scope);
  return keys.includes(status);
}

/**
 * Maps filter UI value to board scope.
 * Unset / Active → active pipeline only; All statuses → every stage; Closed → terminal stages only.
 */
export function resolveBoardLifecycleScope(value: string | undefined): BoardLifecycleScope {
  if (value === 'ALL') return 'ALL';
  if (value === 'CLOSED') return 'CLOSED';
  return DEFAULT_BOARD_LIFECYCLE_SCOPE;
}
