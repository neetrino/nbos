import { describe, expect, it, vi } from 'vitest';
import { listAccessibleClientConversations } from './messenger-core-client-list.ops';

function clientRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    zone: 'CLIENT',
    type: 'EXTERNAL',
    title: 'Lead',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    lastMessageAt: new Date('2026-09-05T12:00:00.000Z'),
    messages: [
      {
        content: 'hello',
        direction: 'INBOUND',
        senderId: null,
        createdAt: new Date('2026-09-05T12:00:00.000Z'),
      },
    ],
    readStates: [{ lastReadAt: new Date('2020-01-01T00:00:00.000Z') }],
    userSettings: [],
    participants: [{ role: 'MEMBER' }],
    externalMappings: [],
    links: [],
    productCommunicationBindings: [],
    attentions: [],
    ...overrides,
  };
}

describe('Client conversation list unread', () => {
  it('selects latest senderId and marks own send 0 / inbound 1', async () => {
    const findMany = vi.fn().mockResolvedValue([
      clientRow({
        id: 'mine',
        messages: [
          {
            content: 'own',
            direction: 'OUTBOUND',
            senderId: 'e1',
            createdAt: new Date('2026-09-05T12:00:00.000Z'),
          },
        ],
      }),
      clientRow({
        id: 'inbound',
        messages: [
          {
            content: 'wa',
            direction: 'INBOUND',
            senderId: null,
            createdAt: new Date('2026-09-05T12:00:00.000Z'),
          },
        ],
      }),
    ]);
    const result = await listAccessibleClientConversations(
      {
        messengerConversation: { findMany },
        resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      'e1',
      'ALL',
      'ALL',
      { section: 'inbox' },
    );
    expect(findMany.mock.calls[0]?.[0]?.include?.messages?.select).toEqual({
      content: true,
      direction: true,
      senderId: true,
      createdAt: true,
    });
    expect(result.items.find((row) => row.id === 'mine')?.unreadCount).toBe(0);
    expect(result.items.find((row) => row.id === 'inbound')?.unreadCount).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('filters unread and needs_response in SQL instead of a pageSize*5 slice', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ id: 'match-1' }, { id: 'match-2' }]);
    const findMany = vi.fn().mockResolvedValue([
      clientRow({ id: 'match-1' }),
      clientRow({
        id: 'match-2',
        messages: [{ content: 'later', direction: 'OUTBOUND', senderId: 'e1' }],
      }),
    ]);
    const prisma = {
      $queryRaw: queryRaw,
      messengerConversation: { findMany },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const unread = await listAccessibleClientConversations(prisma as never, 'e1', 'ALL', 'ALL', {
      filter: 'unread',
      pageSize: 2,
    });
    const needs = await listAccessibleClientConversations(prisma as never, 'e1', 'ALL', 'ALL', {
      filter: 'needs_response',
      pageSize: 2,
    });
    expect(queryRaw).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(queryRaw.mock.calls[0]?.[0] ?? '')).toMatch(/IS DISTINCT FROM/i);
    expect(JSON.stringify(queryRaw.mock.calls[1]?.[0] ?? '')).toMatch(/INBOUND/);
    expect(findMany.mock.calls.some((call) => call[0]?.take === 10)).toBe(false);
    expect(unread.items.map((row) => row.id)).toEqual(['match-1', 'match-2']);
    expect(needs.hasMore).toBe(false);
  });

  it('uses the latest visible direction for needs_response, not any inbound existence', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ id: 'waiting' }]);
    const findMany = vi.fn().mockResolvedValue([
      clientRow({
        id: 'waiting',
        messages: [{ content: 'client', direction: 'INBOUND', senderId: null }],
      }),
    ]);
    const result = await listAccessibleClientConversations(
      {
        $queryRaw: queryRaw,
        messengerConversation: { findMany },
        resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      'e1',
      'ALL',
      'ALL',
      { filter: 'needs_response', pageSize: 1 },
    );
    expect(JSON.stringify(queryRaw.mock.calls[0]?.[0] ?? '')).toMatch(/INBOUND/);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.lastMessageDirection).toBe('INBOUND');
  });
});
