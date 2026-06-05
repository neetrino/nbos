import { describe, it, expect } from 'vitest';
import {
  TASK_LIST_DEFAULT_PAGE_SIZE,
  TASK_LIST_MAX_PAGE_SIZE,
} from './task-list-pagination.constants';
import { normalizeTaskListPage, normalizeTaskListPageSize } from './task-list-pagination';

describe('normalizeTaskListPageSize', () => {
  it('returns default when undefined', () => {
    expect(normalizeTaskListPageSize(undefined)).toBe(TASK_LIST_DEFAULT_PAGE_SIZE);
  });

  it('caps at TASK_LIST_MAX_PAGE_SIZE', () => {
    expect(normalizeTaskListPageSize(TASK_LIST_MAX_PAGE_SIZE)).toBe(TASK_LIST_MAX_PAGE_SIZE);
    expect(normalizeTaskListPageSize(999)).toBe(TASK_LIST_MAX_PAGE_SIZE);
  });

  it('floors invalid values to default', () => {
    expect(normalizeTaskListPageSize(0)).toBe(TASK_LIST_DEFAULT_PAGE_SIZE);
  });
});

describe('normalizeTaskListPage', () => {
  it('returns 1 for invalid page', () => {
    expect(normalizeTaskListPage(undefined)).toBe(1);
    expect(normalizeTaskListPage(-1)).toBe(1);
  });
});
