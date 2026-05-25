import type { NotificationService } from '../notifications/notification.service';

const EVENT_TYPE = 'tasks.review.requested';
const SOURCE_MODULE = 'tasks';

export type TaskReviewNotifyInput = {
  taskId: string;
  taskCode: string;
  taskTitle: string;
  reviewerId: string | null;
  assigneeId: string | null;
};

/** Notifies reviewer (or assignee fallback) when a task is submitted for review. */
export async function notifyTaskReviewRequested(
  notifications: NotificationService,
  input: TaskReviewNotifyInput,
): Promise<void> {
  const recipientId = input.reviewerId ?? input.assigneeId;
  if (!recipientId) return;

  const dedupeKey = `task-review:${input.taskId}`;
  await notifications.create({
    type: EVENT_TYPE,
    recipientId,
    title: `Review requested: ${input.taskCode}`,
    body: input.taskTitle,
    link: `/tasks?openTaskId=${encodeURIComponent(input.taskId)}`,
    actionLabel: 'Open task',
    category: 'action_required',
    priority: 'normal',
    entityType: 'TASK',
    entityId: input.taskId,
    sourceModule: SOURCE_MODULE,
    idempotencyKey: dedupeKey,
    dedupeKey,
    payload: {
      taskId: input.taskId,
      taskCode: input.taskCode,
    },
  });
}
