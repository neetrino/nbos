import { describe, expect, it, vi } from 'vitest';
import {
  listAccessibleInternalConversations,
  listAccessibleInternalConversationsByIds,
} from './messenger-core-internal-list.ops';
import { TASK_DISCUSSION_VISIBILITY_HIDDEN } from './messenger-task-discussion.metadata';

function listRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    zone: 'INTERNAL',
    type: 'INTERNAL_GROUP',
    title: 'Marketing',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    lastMessageAt: new Date('2026-08-30T12:00:00.000Z'),
    messages: [{ content: 'hello' }],
    readStates: [],
    userSettings: [],
    participants: [],
    ...overrides,
  };
}

describe('Internal conversation list', () => {
  it('orders by recent Internal activity and excludes CLIENT zone', async () => {
    const findMany = vi.fn().mockResolvedValue([
      listRow({ id: 'newer', lastMessageAt: new Date('2026-08-30T15:00:00.000Z') }),
      listRow({
        id: 'older',
        lastMessageAt: new Date('2026-08-30T11:00:00.000Z'),
        title: 'Office',
      }),
    ]);
    const prisma = {
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const result = await listAccessibleInternalConversations(
      prisma as never,
      'e1',
      'ALL',
      {
        section: 'all',
      },
      'ALL',
    );
    const where = findMany.mock.calls[0]?.[0]?.where;
    expect(JSON.stringify(where)).toContain('INTERNAL');
    expect(JSON.stringify(where)).not.toContain('CLIENT');
    expect(findMany.mock.calls[0]?.[0]?.orderBy).toEqual([
      { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ]);
    expect(result.items.map((row) => row.id)).toEqual(['newer', 'older']);
    expect(result.items.every((row) => row.zone === 'INTERNAL')).toBe(true);
    expect(result.items.every((row) => row.canWrite === true)).toBe(true);
  });

  it('returns an empty mentions hook until Slice 6 persist exists', async () => {
    const prisma = { messengerConversation: { findMany: vi.fn() } };
    const result = await listAccessibleInternalConversations(prisma as never, 'e1', 'ALL', {
      filter: 'mentions',
    });
    expect(result).toEqual({ items: [], mentionsAvailable: false });
    expect(prisma.messengerConversation.findMany).not.toHaveBeenCalled();
  });

  it('filters Groups to INTERNAL_GROUP and Direct to DIRECT', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await listAccessibleInternalConversations(prisma as never, 'e1', 'ALL', { section: 'groups' });
    expect(JSON.stringify(findMany.mock.calls[0]?.[0]?.where)).toContain('INTERNAL_GROUP');
    await listAccessibleInternalConversations(prisma as never, 'e1', 'OWN', { section: 'direct' });
    expect(JSON.stringify(findMany.mock.calls[1]?.[0]?.where)).toContain('DIRECT');
    expect(prisma.resourceAccessGrant.findMany).toHaveBeenCalled();
  });

  it('filters Products by type PRODUCT, Deals by DEAL, Work Spaces by WORKSPACE link', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await listAccessibleInternalConversations(prisma as never, 'e1', 'ALL', {
      section: 'products',
    });
    expect(JSON.stringify(findMany.mock.calls[0]?.[0]?.where)).toContain('PRODUCT');
    await listAccessibleInternalConversations(prisma as never, 'e1', 'ALL', { section: 'deals' });
    expect(JSON.stringify(findMany.mock.calls[1]?.[0]?.where)).toContain('DEAL');
    await listAccessibleInternalConversations(prisma as never, 'e1', 'ALL', {
      section: 'workspaces',
    });
    expect(JSON.stringify(findMany.mock.calls[2]?.[0]?.where)).toContain('WORKSPACE');
    await listAccessibleInternalConversations(prisma as never, 'e1', 'ALL', { section: 'tasks' });
    expect(JSON.stringify(findMany.mock.calls[3]?.[0]?.where)).toContain('TASK');
  });

  it('does not grant canWrite to a READ_ONLY participant with OWN edit', async () => {
    const findMany = vi.fn().mockResolvedValue([
      listRow({
        participants: [
          {
            employeeId: 'e1',
            role: 'READ_ONLY',
            employee: { firstName: 'A', lastName: 'B' },
          },
        ],
      }),
    ]);
    const prisma = {
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const result = await listAccessibleInternalConversations(
      prisma as never,
      'e1',
      'OWN',
      {
        section: 'all',
      },
      'OWN',
    );
    expect(result.items[0]?.canWrite).toBe(false);
  });

  it('does not list TASK conversations the caller cannot open in Tasks', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
      task: { findMany: vi.fn().mockResolvedValue([{ id: 'task-ok' }]) },
    };
    await listAccessibleInternalConversations(
      prisma as never,
      'e1',
      'ALL',
      { section: 'all' },
      'ALL',
      { employeeId: 'e1', departmentIds: [], viewScope: 'OWN' },
    );
    const where = JSON.stringify(findMany.mock.calls[0]?.[0]?.where);
    expect(where).toContain('TASK');
    expect(where).toContain('task-ok');
    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it('does not use a HIDDEN Task note as lastMessagePreview', async () => {
    const findMany = vi.fn().mockResolvedValue([
      listRow({
        type: 'TASK',
        messages: [{ content: 'visible note' }],
      }),
    ]);
    const prisma = {
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const result = await listAccessibleInternalConversations(prisma as never, 'e1', 'ALL', {
      section: 'tasks',
    });
    const includeWhere = JSON.stringify(findMany.mock.calls[0]?.[0]?.include?.messages?.where);
    expect(includeWhere).toContain(TASK_DISCUSSION_VISIBILITY_HIDDEN);
    expect(includeWhere).toContain('taskDiscussion');
    expect(result.items[0]?.lastMessagePreview).toBe('visible note');
    expect(result.items[0]?.lastMessagePreview).not.toBe('hidden body');
  });

  it('does not match a HIDDEN Task note body in search', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await listAccessibleInternalConversations(prisma as never, 'e1', 'ALL', {
      section: 'all',
      q: 'secret-hidden-body',
    });
    const where = JSON.stringify(findMany.mock.calls[0]?.[0]?.where);
    expect(where).toContain('secret-hidden-body');
    expect(where).toContain(TASK_DISCUSSION_VISIBILITY_HIDDEN);
    expect(where).toContain('taskDiscussion');
  });

  it('does not return a TASK conversation id the caller cannot open via list-by-ids', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([listRow({ id: 'group-ok', type: 'INTERNAL_GROUP' })]);
    const prisma = {
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
      task: { findMany: vi.fn().mockResolvedValue([{ id: 'task-ok' }]) },
    };
    const items = await listAccessibleInternalConversationsByIds(
      prisma as never,
      'e1',
      'ALL',
      ['task-secret', 'group-ok'],
      'ALL',
      { employeeId: 'e1', departmentIds: [], viewScope: 'OWN' },
    );
    const where = JSON.stringify(findMany.mock.calls[0]?.[0]?.where);
    expect(where).toContain('task-secret');
    expect(where).toContain('TASK');
    expect(where).toContain('task-ok');
    expect(prisma.task.findMany).toHaveBeenCalled();
    expect(items.map((row) => row.id)).toEqual(['group-ok']);
    expect(items.map((row) => row.id)).not.toContain('task-secret');
  });
});
