import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Task } from '@/lib/api/tasks';
import { persistColumnTaskReorder } from './persist-column-task-reorder';

const reorderMock = vi.fn();

vi.mock('@/lib/api/tasks', () => ({
  tasksApi: {
    reorder: (...args: unknown[]) => reorderMock(...args),
  },
}));

function task(id: string, status: string): Task {
  return {
    id,
    status,
    workspaceSortOrder: 0,
    myPlanSortOrder: 0,
    createdAt: '2026-01-01',
  } as Task;
}

describe('persistColumnTaskReorder', () => {
  beforeEach(() => {
    reorderMock.mockReset();
    reorderMock.mockResolvedValue({ success: true });
  });

  it('calls tasksApi.reorder with column task ids in order', () => {
    const tasks = [task('a', 'OPEN'), task('b', 'OPEN'), task('c', 'IN_PROGRESS')];
    const setTasks = vi.fn();

    persistColumnTaskReorder({
      tasks,
      setTasks,
      taskId: 'b',
      toIndex: 0,
      isInColumn: (item) => item.status === 'OPEN',
      scope: 'workspace',
    });

    expect(setTasks).toHaveBeenCalledOnce();
    expect(reorderMock).toHaveBeenCalledWith(['b', 'a'], 'workspace');
    const next = setTasks.mock.calls[0]?.[0] as Task[];
    expect(next.find((item) => item.id === 'b')?.workspaceSortOrder).toBe(0);
    expect(next.find((item) => item.id === 'a')?.workspaceSortOrder).toBe(1);
  });

  it('updates myPlanSortOrder so My Plan columns keep the dragged order', () => {
    const tasks = [
      { ...task('a', 'OPEN'), myPlanStageId: 'team', myPlanSortOrder: 0 },
      { ...task('b', 'OPEN'), myPlanStageId: 'team', myPlanSortOrder: 1 },
      { ...task('c', 'OPEN'), myPlanStageId: 'team', myPlanSortOrder: 2 },
      { ...task('d', 'OPEN'), myPlanStageId: 'team', myPlanSortOrder: 3 },
    ];
    const setTasks = vi.fn();

    persistColumnTaskReorder({
      tasks,
      setTasks,
      taskId: 'd',
      toIndex: 0,
      isInColumn: (item) => item.myPlanStageId === 'team',
      scope: 'my-plan',
    });

    const next = setTasks.mock.calls[0]?.[0] as Task[];
    expect(next.map((item) => item.id)).toEqual(['d', 'a', 'b', 'c']);
    expect(next.map((item) => item.myPlanSortOrder)).toEqual([0, 1, 2, 3]);
    expect(reorderMock).toHaveBeenCalledWith(['d', 'a', 'b', 'c'], 'my-plan');
  });

  it('rolls back on reorder failure', async () => {
    reorderMock.mockRejectedValue(new Error('network'));
    const tasks = [task('a', 'OPEN'), task('b', 'OPEN')];
    const setTasks = vi.fn();

    persistColumnTaskReorder({
      tasks,
      setTasks,
      taskId: 'b',
      toIndex: 0,
      isInColumn: (item) => item.status === 'OPEN',
      scope: 'workspace',
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(setTasks).toHaveBeenCalledTimes(2);
    expect(setTasks.mock.calls[1]?.[0]).toBe(tasks);
  });
});
