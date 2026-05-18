export const UNFINISHED_SPRINT_TASK_ACTIONS = ['BACKLOG', 'NEXT_SPRINT', 'KEEP'] as const;

export type UnfinishedSprintTaskAction = (typeof UNFINISHED_SPRINT_TASK_ACTIONS)[number];

export function parseUnfinishedSprintTaskAction(
  raw: string | undefined,
): UnfinishedSprintTaskAction {
  const v = raw?.trim().toUpperCase();
  if (v === 'BACKLOG' || v === 'NEXT_SPRINT' || v === 'KEEP') return v;
  throw new Error(`Invalid unfinishedTaskAction: ${raw ?? ''}`);
}
