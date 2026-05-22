import type { Task } from '@/lib/api/tasks';
import { normalizeTaskSheetWorkflowStatus } from './task-sheet-workflow-footer';

export type TaskWorkflowFooterAction =
  | 'start'
  | 'complete'
  | 'reopen'
  | 'hold'
  | 'approveReview'
  | 'requestReviewChanges';

/** Applies the expected post-action task shape before the API round-trip finishes. */
export function applyOptimisticTaskWorkflowAction(
  task: Task,
  action: TaskWorkflowFooterAction,
): Task {
  const now = new Date().toISOString();

  switch (action) {
    case 'start':
      return { ...task, status: 'IN_PROGRESS' };
    case 'complete':
      return { ...task, status: 'COMPLETED', completedAt: now };
    case 'reopen':
      return {
        ...task,
        status: 'OPEN',
        completedAt: null,
        reviewApprovedAt: null,
        reviewRequestedAt: null,
      };
    case 'hold':
      return { ...task, status: 'ON_HOLD' };
    case 'requestReviewChanges':
      return {
        ...task,
        status: 'IN_PROGRESS',
        reviewApprovedAt: null,
        reviewRequestedAt: null,
      };
    case 'approveReview':
      return { ...task, reviewApprovedAt: now };
    default:
      return task;
  }
}

/** Footer-only optimistic status (no task fetch / enrich). */
export function optimisticWorkflowStatusForAction(
  currentStatus: string,
  action: TaskWorkflowFooterAction,
): string {
  const normalized = normalizeTaskSheetWorkflowStatus(currentStatus);

  switch (action) {
    case 'start':
      return 'IN_PROGRESS';
    case 'complete':
      return 'COMPLETED';
    case 'reopen':
      return 'OPEN';
    case 'hold':
      return 'ON_HOLD';
    case 'requestReviewChanges':
      return 'IN_PROGRESS';
    case 'approveReview':
      return normalized;
    default:
      return normalized;
  }
}
