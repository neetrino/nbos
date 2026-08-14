import { describe, expect, it } from 'vitest';
import type { Task, TaskLink } from '@/lib/api/tasks';
import { pickTaskCardContextChips } from './task-mini-card-meta';

function link(
  partial: Partial<TaskLink> & Pick<TaskLink, 'id' | 'entityType' | 'entityId'>,
): TaskLink {
  return {
    taskId: 't1',
    createdAt: '2026-01-01T00:00:00.000Z',
    entityLabel: null,
    ...partial,
  };
}

function task(partial: Partial<Task>): Pick<Task, 'links' | 'workspaceId' | 'workspace'> {
  return {
    links: [],
    workspaceId: null,
    workspace: null,
    ...partial,
  };
}

describe('pickTaskCardContextChips', () => {
  it('prefers product then project', () => {
    const chips = pickTaskCardContextChips(
      task({
        links: [
          link({
            id: 'l1',
            entityType: 'PROJECT',
            entityId: 'p1',
            entityLabel: 'Acme',
          }),
          link({
            id: 'l2',
            entityType: 'PRODUCT',
            entityId: 'prod-1',
            entityLabel: 'Website',
          }),
          link({
            id: 'l3',
            entityType: 'DEAL',
            entityId: 'd1',
            entityLabel: 'Deal A',
          }),
        ],
      }),
    );

    expect(chips).toEqual([
      { key: 'l2', kind: 'PRODUCT', entityType: 'PRODUCT', label: 'Website' },
      { key: 'l1', kind: 'PROJECT', entityType: 'PROJECT', label: 'Acme' },
    ]);
  });

  it('includes work space when there is room', () => {
    const chips = pickTaskCardContextChips(
      task({
        links: [
          link({
            id: 'l1',
            entityType: 'PROJECT',
            entityId: 'p1',
            entityLabel: 'Acme',
          }),
        ],
        workspaceId: 'ws-1',
        workspace: { id: 'ws-1', name: 'Marketing 1' },
      }),
    );

    expect(chips.map((chip) => chip.kind)).toEqual(['PROJECT', 'WORK_SPACE']);
    expect(chips[1]?.label).toBe('Marketing 1');
  });

  it('can hide work space on a workspace board', () => {
    const chips = pickTaskCardContextChips(
      task({
        workspaceId: 'ws-1',
        workspace: { id: 'ws-1', name: 'Marketing 1' },
      }),
      { hideWorkspace: true },
    );
    expect(chips).toEqual([]);
  });

  it('shows project chip even when entityLabel is missing after reload', () => {
    const chips = pickTaskCardContextChips(
      task({
        links: [
          link({
            id: 'l1',
            entityType: 'PROJECT',
            entityId: 'p1',
            entityLabel: null,
          }),
        ],
      }),
    );

    expect(chips).toEqual([{ key: 'l1', kind: 'PROJECT', entityType: 'PROJECT', label: 'Project' }]);
  });
});
