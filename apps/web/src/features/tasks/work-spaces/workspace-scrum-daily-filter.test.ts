import { describe, expect, it } from 'vitest';
import type { Task } from '@/lib/api/tasks';

import {
  filterTasksForScrumDailyExecution,
  isScrumPlanningExcludedFromDaily,
} from './workspace-scrum-daily-filter';

function task(planningStatus: string): Task {
  return {
    id: 't-1',
    code: 'TASK-1',
    title: 'Test',
    description: null,
    planningStatus,
    status: 'OPEN',
    priority: 'NORMAL',
    startDate: null,
    dueDate: null,
    completedAt: null,
    reviewRequestedAt: null,
    reviewApprovedAt: null,
    completionRules: null,
    parentId: null,
    workspaceId: null,
    myPlanStageId: null,
    coAssignees: [],
    observers: [],
    subtasks: [],
    checklists: [],
    links: [],
    myPlanSortOrder: 0,
    workspaceSortOrder: 0,
    chatId: null,
    isRecurring: false,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    creator: { id: 'e-1', firstName: 'A', lastName: 'B' },
    assignee: null,
    _count: { subtasks: 0, checklists: 0 },
  };
}

describe('filterTasksForScrumDailyExecution', () => {
  const tasks = [task('ACTIVE_SPRINT'), task('BACKLOG'), task('FUTURE_SPRINT'), task('UNPLANNED')];

  it('returns all tasks when scrum is disabled', () => {
    expect(
      filterTasksForScrumDailyExecution(tasks, { scrumEnabled: false, boardView: 'kanban' }),
    ).toHaveLength(4);
  });

  it('keeps only active sprint on kanban when scrum is enabled', () => {
    const filtered = filterTasksForScrumDailyExecution(tasks, {
      scrumEnabled: true,
      boardView: 'kanban',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.planningStatus).toBe('ACTIVE_SPRINT');
  });

  it('filters by active sprint id when provided', () => {
    const withSprint = [
      { ...task('ACTIVE_SPRINT'), id: 'a', sprintId: 's-active' },
      { ...task('ACTIVE_SPRINT'), id: 'b', sprintId: 's-other' },
    ];
    const filtered = filterTasksForScrumDailyExecution(withSprint, {
      scrumEnabled: true,
      boardView: 'kanban',
      activeSprintId: 's-active',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('a');
  });

  it('does not filter deadline or my-plan views', () => {
    expect(
      filterTasksForScrumDailyExecution(tasks, { scrumEnabled: true, boardView: 'deadline' }),
    ).toHaveLength(4);
    expect(
      filterTasksForScrumDailyExecution(tasks, { scrumEnabled: true, boardView: 'my-plan' }),
    ).toHaveLength(4);
  });
});

describe('isScrumPlanningExcludedFromDaily', () => {
  it('flags backlog and future sprint', () => {
    expect(isScrumPlanningExcludedFromDaily('BACKLOG')).toBe(true);
    expect(isScrumPlanningExcludedFromDaily('FUTURE_SPRINT')).toBe(true);
    expect(isScrumPlanningExcludedFromDaily('ACTIVE_SPRINT')).toBe(false);
  });
});
