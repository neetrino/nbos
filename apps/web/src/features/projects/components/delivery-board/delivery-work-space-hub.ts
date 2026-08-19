import { PRODUCT_GATE_CLOSED_TASK_STATUSES } from '@nbos/shared';
import type { Task } from '@/lib/api/tasks';

export const DELIVERY_WORK_SPACE_TASK_ENTITY = 'PRODUCT';
export const DELIVERY_WORK_SPACE_PREVIEW_LIMIT = 5;
export const DELIVERY_WORK_SPACE_FETCH_PAGE_SIZE = 50;

const CLOSED_TASK_STATUS = new Set<string>(PRODUCT_GATE_CLOSED_TASK_STATUSES);

const PREVIEW_STATUS_RANK: Record<string, number> = {
  IN_PROGRESS: 0,
  REVIEW: 1,
  OPEN: 2,
};

const FALLBACK_STATUS_RANK = 9;

export function isDeliveryWorkSpaceActiveTask(status: string): boolean {
  return !CLOSED_TASK_STATUS.has(status);
}

export function buildDeliveryWorkSpaceTaskLinks(productId: string): Array<{
  entityType: string;
  entityId: string;
}> {
  return [{ entityType: DELIVERY_WORK_SPACE_TASK_ENTITY, entityId: productId }];
}

export function buildDeliveryWorkSpaceTasksQuery(productId: string): {
  entityType: string;
  entityId: string;
  pageSize: number;
  sortBy: 'updatedAt';
  sortOrder: 'desc';
} {
  return {
    entityType: DELIVERY_WORK_SPACE_TASK_ENTITY,
    entityId: productId,
    pageSize: DELIVERY_WORK_SPACE_FETCH_PAGE_SIZE,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  };
}

export function compareDeliveryWorkSpacePreviewTasks(left: Task, right: Task): number {
  const statusDelta =
    (PREVIEW_STATUS_RANK[left.status] ?? FALLBACK_STATUS_RANK) -
    (PREVIEW_STATUS_RANK[right.status] ?? FALLBACK_STATUS_RANK);
  if (statusDelta !== 0) return statusDelta;

  const dueDelta = compareNullableDates(left.dueDate, right.dueDate);
  if (dueDelta !== 0) return dueDelta;

  return right.updatedAt.localeCompare(left.updatedAt);
}

export function selectDeliveryWorkSpaceActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => isDeliveryWorkSpaceActiveTask(task.status));
}

export function selectDeliveryWorkSpacePreview(tasks: Task[]): Task[] {
  return [...selectDeliveryWorkSpaceActiveTasks(tasks)]
    .sort(compareDeliveryWorkSpacePreviewTasks)
    .slice(0, DELIVERY_WORK_SPACE_PREVIEW_LIMIT);
}

export function formatDeliveryWorkSpaceActiveCount(
  activeCount: number,
  fetchedCount: number,
  pageSize: number = DELIVERY_WORK_SPACE_FETCH_PAGE_SIZE,
): string {
  const capped = fetchedCount >= pageSize;
  const n = capped ? `${activeCount}+` : String(activeCount);
  return `${n} active`;
}

function compareNullableDates(left: string | null, right: string | null): number {
  if (left === right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right);
}
