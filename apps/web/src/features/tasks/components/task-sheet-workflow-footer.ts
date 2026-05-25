/** Footer workflow button layout for {@link TaskSheetStickyFooter}. */

export type TaskWorkflowFooterMode = 'start-and-complete' | 'complete-only' | 'resume-only';

export function normalizeTaskSheetWorkflowStatus(status: string): string {
  if (status === 'NEW') return 'OPEN';
  if (status === 'DONE') return 'COMPLETED';
  return status;
}

export function resolveTaskWorkflowFooterMode(status: string): TaskWorkflowFooterMode {
  const normalized = normalizeTaskSheetWorkflowStatus(status);

  if (normalized === 'OPEN') return 'start-and-complete';
  if (normalized === 'IN_PROGRESS' || normalized === 'REVIEW') return 'complete-only';
  if (normalized === 'COMPLETED' || normalized === 'ON_HOLD') return 'resume-only';

  return 'start-and-complete';
}
