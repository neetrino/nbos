import { tasksApi, type Task } from '@/lib/api/tasks';
import type { TaskWorkflowFooterAction } from './task-workflow-optimistic';

/** Runs a single workflow transition on the server (one action per call). */
export async function runTaskWorkflowApi(
  taskId: string,
  action: TaskWorkflowFooterAction,
): Promise<Task> {
  switch (action) {
    case 'start':
      return tasksApi.start(taskId);
    case 'complete':
      return tasksApi.complete(taskId);
    case 'reopen':
      return tasksApi.reopen(taskId);
    case 'approveReview':
      return tasksApi.approveReview(taskId);
    case 'requestReviewChanges':
      return tasksApi.requestReviewChanges(taskId);
    case 'hold':
      return tasksApi.setOnHold(taskId);
    default:
      return tasksApi.getById(taskId);
  }
}
