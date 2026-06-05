import {
  TASK_LIST_DEFAULT_PAGE_SIZE,
  TASK_LIST_MAX_PAGE_SIZE,
} from './task-list-pagination.constants';

export function normalizeTaskListPage(raw?: number): number {
  if (raw === undefined || raw === null || Number.isNaN(raw)) {
    return 1;
  }
  const page = Math.floor(raw);
  return page >= 1 ? page : 1;
}

export function normalizeTaskListPageSize(raw?: number): number {
  if (raw === undefined || raw === null || Number.isNaN(raw)) {
    return TASK_LIST_DEFAULT_PAGE_SIZE;
  }
  const size = Math.floor(raw);
  if (size < 1) {
    return TASK_LIST_DEFAULT_PAGE_SIZE;
  }
  return Math.min(size, TASK_LIST_MAX_PAGE_SIZE);
}
