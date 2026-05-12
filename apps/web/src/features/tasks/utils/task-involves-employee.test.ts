import { describe, it, expect } from 'vitest';
import { taskInvolvesEmployee } from '@/features/tasks/utils/task-involves-employee';
import type { Task } from '@/lib/api/tasks';

const baseTask = {
  id: 't1',
  code: 'T-2026-0001',
  title: 'Example',
  description: null,
  status: 'OPEN',
  priority: 'NORMAL',
  startDate: null,
  dueDate: null,
  completedAt: null,
  completionRules: null,
  parentId: null,
  workspaceId: null,
  planningStatus: 'UNPLANNED',
  myPlanStageId: null,
  myPlanSortOrder: 0,
  workspaceSortOrder: 0,
  chatId: null,
  isRecurring: false,
  coAssignees: [] as string[],
  observers: [] as string[],
  createdAt: '',
  updatedAt: '',
  creator: { id: 'c1', firstName: 'A', lastName: 'B' },
  assignee: null,
  links: [],
  checklists: [],
  subtasks: [],
  _count: { subtasks: 0, checklists: 0 },
} satisfies Task;

describe('taskInvolvesEmployee', () => {
  it('returns true for assignee', () => {
    const task: Task = {
      ...baseTask,
      assignee: { id: 'e1', firstName: 'X', lastName: 'Y' },
    };
    expect(taskInvolvesEmployee(task, 'e1')).toBe(true);
  });

  it('returns true for creator', () => {
    expect(taskInvolvesEmployee(baseTask, 'c1')).toBe(true);
  });

  it('returns true for co-assignee', () => {
    const task: Task = { ...baseTask, coAssignees: ['e2'] };
    expect(taskInvolvesEmployee(task, 'e2')).toBe(true);
  });

  it('returns true for observer', () => {
    const task: Task = { ...baseTask, observers: ['e3'] };
    expect(taskInvolvesEmployee(task, 'e3')).toBe(true);
  });

  it('returns false when not involved', () => {
    expect(taskInvolvesEmployee(baseTask, 'z9')).toBe(false);
  });
});
