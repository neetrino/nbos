import { tasksApi, type Task } from '@/lib/api/tasks';
import { normalizeTaskStatusForDraft } from '@/features/tasks/utils/task-status-draft';

/** Apply a pipeline stage click using the same transitions as the task board. */
export async function applyTaskSheetPipelineStatus(
  task: Task,
  targetStatus: string,
): Promise<Task> {
  const current = normalizeTaskStatusForDraft(task.status);
  const target = normalizeTaskStatusForDraft(targetStatus);
  if (current === target) return task;

  if (target === 'IN_PROGRESS' && (current === 'OPEN' || current === 'ON_HOLD')) {
    return tasksApi.start(task.id);
  }
  if (target === 'COMPLETED') {
    return tasksApi.complete(task.id);
  }
  if (target === 'OPEN' && current !== 'OPEN') {
    return tasksApi.reopen(task.id);
  }
  if (target === 'REVIEW' && current !== 'REVIEW') {
    return tasksApi.submitForReview(task.id);
  }
  if (target === 'ON_HOLD' && current !== 'ON_HOLD') {
    return tasksApi.setOnHold(task.id);
  }
  return tasksApi.update(task.id, { status: target });
}
