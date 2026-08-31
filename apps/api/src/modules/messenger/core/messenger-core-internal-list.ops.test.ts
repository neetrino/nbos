import { describe, expect, it, vi } from 'vitest';
import { listAccessibleInternalConversations } from './messenger-core-internal-list.ops';

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
});
