import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskLink } from '@/lib/api/tasks';
import { addTaskEntityLink, removeTaskEntityLink } from './sync-task-entity-links';

const addLink = vi.fn();
const removeLink = vi.fn();

vi.mock('@/lib/api/tasks', () => ({
  tasksApi: {
    addLink: (...args: unknown[]) => addLink(...args),
    removeLink: (...args: unknown[]) => removeLink(...args),
  },
}));

function link(
  partial: Partial<TaskLink> & Pick<TaskLink, 'id' | 'entityType' | 'entityId'>,
): TaskLink {
  return {
    taskId: 'task-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    entityLabel: null,
    ...partial,
  };
}

describe('addTaskEntityLink', () => {
  beforeEach(() => {
    addLink.mockReset();
  });

  it('skips when already linked', async () => {
    const links = [link({ id: 'l1', entityType: 'PROJECT', entityId: 'p1' })];
    const next = await addTaskEntityLink({
      taskId: 'task-1',
      links,
      entityType: 'PROJECT',
      entityId: 'p1',
      entityLabel: 'Acme',
    });
    expect(addLink).not.toHaveBeenCalled();
    expect(next).toBe(links);
  });

  it('adds with picker label', async () => {
    addLink.mockResolvedValueOnce(
      link({ id: 'l2', entityType: 'PRODUCT', entityId: 'prod-1', entityLabel: null }),
    );
    const next = await addTaskEntityLink({
      taskId: 'task-1',
      links: [],
      entityType: 'PRODUCT',
      entityId: 'prod-1',
      entityLabel: 'Website',
    });
    expect(addLink).toHaveBeenCalledWith('task-1', 'PRODUCT', 'prod-1');
    expect(next[0]?.entityLabel).toBe('Website');
  });
});

describe('removeTaskEntityLink', () => {
  beforeEach(() => {
    removeLink.mockReset();
  });

  it('removes after API success', async () => {
    removeLink.mockResolvedValueOnce(undefined);
    const links = [
      link({ id: 'l1', entityType: 'DEAL', entityId: 'd1', entityLabel: 'Deal' }),
      link({ id: 'l2', entityType: 'ORDER', entityId: 'o1', entityLabel: 'ORD' }),
    ];
    const next = await removeTaskEntityLink('task-1', links, 'l1');
    expect(removeLink).toHaveBeenCalledWith('task-1', 'l1');
    expect(next).toHaveLength(1);
    expect(next[0]?.id).toBe('l2');
  });
});
