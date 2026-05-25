import { describe, expect, it } from 'vitest';
import {
  getActiveSprintId,
  groupTasksForScrumPlanner,
  sprintCompletionPercent,
} from './workspace-scrum-groups';
import type { Task } from '@/lib/api/tasks';
import type { WorkSpaceSprint } from '@/lib/api/work-space-sprints';

const sprint = (id: string, status: WorkSpaceSprint['status']): WorkSpaceSprint => ({
  id,
  workspaceId: 'ws-1',
  name: id,
  goal: null,
  status,
  startDate: null,
  endDate: null,
  closedAt: null,
  sortOrder: 0,
  createdAt: '',
  updatedAt: '',
  _count: { tasks: 0 },
});

const task = (id: string, sprintId: string | null, status = 'OPEN'): Task =>
  ({
    id,
    sprintId,
    status,
    planningStatus: sprintId ? 'FUTURE_SPRINT' : 'BACKLOG',
  }) as Task;

describe('workspace-scrum-groups', () => {
  it('finds active sprint id', () => {
    expect(getActiveSprintId([sprint('a', 'PLANNING'), sprint('b', 'ACTIVE')])).toBe('b');
  });

  it('groups backlog and sprint tasks', () => {
    const grouped = groupTasksForScrumPlanner(
      [task('t1', null), task('t2', 's1')],
      [sprint('s1', 'PLANNING')],
    );
    expect(grouped.backlog).toHaveLength(1);
    expect(grouped.bySprint.get('s1')).toHaveLength(1);
  });

  it('computes completion percent', () => {
    expect(sprintCompletionPercent([task('t1', 's1', 'COMPLETED'), task('t2', 's1', 'OPEN')])).toBe(
      50,
    );
  });
});
