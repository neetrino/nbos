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
