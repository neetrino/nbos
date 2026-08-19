import { describe, expect, it } from 'vitest';
import type { Task } from '@/lib/api/tasks';
import {
  buildDeliveryWorkSpaceTaskLinks,
  buildDeliveryWorkSpaceTasksQuery,
  compareDeliveryWorkSpacePreviewTasks,
  DELIVERY_WORK_SPACE_FETCH_PAGE_SIZE,
  DELIVERY_WORK_SPACE_PREVIEW_LIMIT,
  DELIVERY_WORK_SPACE_TASK_ENTITY,
  formatDeliveryWorkSpaceActiveCount,
  isDeliveryWorkSpaceActiveTask,
  selectDeliveryWorkSpacePreview,
} from './delivery-work-space-hub';

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'status'>): Task {
  return {
    code: overrides.id,
    title: overrides.title ?? overrides.id,
    description: null,
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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    creator: { id: 'e1', firstName: 'A', lastName: 'B' },
    assignee: null,
    links: [],
    checklists: [],
    subtasks: [],
    ...overrides,
  };
}

describe('delivery-work-space-hub', () => {
  it('treats open pipeline statuses as active and closed as not', () => {
    expect(isDeliveryWorkSpaceActiveTask('OPEN')).toBe(true);
    expect(isDeliveryWorkSpaceActiveTask('IN_PROGRESS')).toBe(true);
    expect(isDeliveryWorkSpaceActiveTask('REVIEW')).toBe(true);
    expect(isDeliveryWorkSpaceActiveTask('COMPLETED')).toBe(false);
    expect(isDeliveryWorkSpaceActiveTask('DONE')).toBe(false);
    expect(isDeliveryWorkSpaceActiveTask('ON_HOLD')).toBe(false);
  });

  it('previews at most 5 active tasks, in-progress first, without closed rows', () => {
    const tasks = [
      task({ id: 'done', status: 'COMPLETED' }),
      task({ id: 'open-old', status: 'OPEN', updatedAt: '2026-01-01T00:00:00.000Z' }),
      task({ id: 'progress', status: 'IN_PROGRESS', dueDate: '2026-08-20T00:00:00.000Z' }),
      task({ id: 'review', status: 'REVIEW', dueDate: '2026-08-21T00:00:00.000Z' }),
      task({ id: 'open-new', status: 'OPEN', updatedAt: '2026-08-19T00:00:00.000Z' }),
      task({ id: 'hold', status: 'ON_HOLD' }),
      task({ id: 'open-3', status: 'OPEN', updatedAt: '2026-08-18T00:00:00.000Z' }),
      task({ id: 'open-4', status: 'OPEN', updatedAt: '2026-08-17T00:00:00.000Z' }),
      task({ id: 'open-5', status: 'OPEN', updatedAt: '2026-08-16T00:00:00.000Z' }),
    ];
    const preview = selectDeliveryWorkSpacePreview(tasks);
    expect(preview).toHaveLength(DELIVERY_WORK_SPACE_PREVIEW_LIMIT);
    expect(preview.map((row) => row.id)).toEqual([
      'progress',
      'review',
      'open-new',
      'open-3',
      'open-4',
    ]);
    expect(preview.every((row) => isDeliveryWorkSpaceActiveTask(row.status))).toBe(true);
  });

  it('sorts sooner due dates ahead of later, nulls last', () => {
    const later = task({ id: 'later', status: 'OPEN', dueDate: '2026-09-01T00:00:00.000Z' });
    const sooner = task({ id: 'sooner', status: 'OPEN', dueDate: '2026-08-20T00:00:00.000Z' });
    const none = task({ id: 'none', status: 'OPEN', dueDate: null });
    expect(compareDeliveryWorkSpacePreviewTasks(sooner, later)).toBeLessThan(0);
    expect(compareDeliveryWorkSpacePreviewTasks(later, none)).toBeLessThan(0);
  });

  it('creates PRODUCT links only — no PROJECT extra', () => {
    const links = buildDeliveryWorkSpaceTaskLinks('prod-1');
    expect(links).toEqual([{ entityType: DELIVERY_WORK_SPACE_TASK_ENTITY, entityId: 'prod-1' }]);
    expect(links.some((link) => link.entityType === 'PROJECT')).toBe(false);

    const query = buildDeliveryWorkSpaceTasksQuery('prod-1');
    expect(query.entityType).toBe('PRODUCT');
    expect(query.entityId).toBe('prod-1');
    expect(query.pageSize).toBe(DELIVERY_WORK_SPACE_FETCH_PAGE_SIZE);
  });

  it('marks the active count as capped when the fetch page is full', () => {
    expect(formatDeliveryWorkSpaceActiveCount(12, 40)).toBe('12 active');
    expect(formatDeliveryWorkSpaceActiveCount(12, DELIVERY_WORK_SPACE_FETCH_PAGE_SIZE)).toBe(
      '12+ active',
    );
  });
});
