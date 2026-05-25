import { describe, it, expect } from 'vitest';
import { resolveTaskOrderContext } from './task-order-context';
import type { Task } from '@/lib/api/tasks';

const taskBase = {
  id: 't1',
  code: 'T-2026-0001',
  title: 'x',
  description: null,
  status: 'OPEN',
  priority: 'NORMAL',
  dueDate: null,
  completedAt: null,
  reviewRequestedAt: null,
  reviewApprovedAt: null,
  completionRules: null,
  parentId: null,
  workspaceId: null,
  planningStatus: 'UNPLANNED',
  myPlanStageId: null,
  myPlanSortOrder: 0,
  workspaceSortOrder: 0,
  chatId: null,
  isRecurring: false,
  coAssignees: [],
  observers: [],
  createdAt: '',
  updatedAt: '',
  creator: { id: 'c1', firstName: 'A', lastName: 'B' },
  assignee: null,
  links: [],
  checklists: [],
  subtasks: [],
  _count: { subtasks: 0, checklists: 0 },
} satisfies Task;

describe('resolveTaskOrderContext', () => {
  it('returns product order and name', () => {
    const t: Task = {
      ...taskBase,
      product: { id: 'p1', name: 'Site', order: { id: 'o1', code: 'ORD-1' } },
    };
    expect(resolveTaskOrderContext(t)).toEqual({
      orderCode: 'ORD-1',
      scopeLabel: 'Site',
    });
  });

  it('returns null when no order signal', () => {
    expect(resolveTaskOrderContext(taskBase)).toBeNull();
  });
});
