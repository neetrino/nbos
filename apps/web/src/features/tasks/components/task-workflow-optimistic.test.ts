import { describe, expect, it } from 'vitest';
import {
  applyOptimisticTaskWorkflowAction,
  optimisticWorkflowStatusForAction,
} from './task-workflow-optimistic';
import type { Task } from '@/lib/api/tasks';

const baseTask = {
  id: 't1',
  code: 'T-1',
  title: 'Test',
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
  planningStatus: 'BACKLOG',
  myPlanStageId: null,
  myPlanSortOrder: 0,
  workspaceSortOrder: 0,
  chatId: null,
  isRecurring: false,
  coAssignees: [],
  observers: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  creator: { id: 'c1', firstName: 'A', lastName: 'B' },
  assignee: null,
  links: [],
  checklists: [],
  subtasks: [],
  _count: { subtasks: 0, checklists: 0 },
} satisfies Task;

describe('applyOptimisticTaskWorkflowAction', () => {
  it('moves open task to in progress on start', () => {
    expect(applyOptimisticTaskWorkflowAction(baseTask, 'start').status).toBe('IN_PROGRESS');
  });

  it('completes task on complete', () => {
    const next = applyOptimisticTaskWorkflowAction(baseTask, 'complete');
    expect(next.status).toBe('COMPLETED');
    expect(next.completedAt).not.toBeNull();
  });

  it('reopens completed task', () => {
    const completed = { ...baseTask, status: 'COMPLETED', completedAt: '2026-02-01T00:00:00.000Z' };
    const next = applyOptimisticTaskWorkflowAction(completed, 'reopen');
    expect(next.status).toBe('OPEN');
    expect(next.completedAt).toBeNull();
  });
});

describe('optimisticWorkflowStatusForAction', () => {
  it('maps complete to completed for footer', () => {
    expect(optimisticWorkflowStatusForAction('IN_PROGRESS', 'complete')).toBe('COMPLETED');
  });
});
