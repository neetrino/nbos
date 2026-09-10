import { describe, expect, it, vi } from 'vitest';
import { listAccessibleInternalConversations } from './messenger-core-internal-list.ops';
import { encodeMessengerListCursor } from './messenger-core-list-page';

const CREATED = new Date('2026-08-01T10:00:00.000Z');
const LAST_AT = new Date('2026-08-30T12:00:00.000Z');

function listRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    zone: 'INTERNAL',
    type: 'INTERNAL_GROUP',
    title: 'Marketing',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: CREATED,
    lastMessageAt: LAST_AT,
    messages: [{ content: 'hello', senderId: 'other', createdAt: LAST_AT }],
    readStates: [],
    userSettings: [],
    participants: [],
    ...overrides,
  };
}

function candidate(id: string, lastMessageAt = LAST_AT, createdAt = CREATED) {
  return { id, lastMessageAt, createdAt };
}

describe('Internal unread list query', () => {
  it('selects unread at the database boundary without a pageSize*5 over-fetch', async () => {
    const pageSize = 2;
    const queryRaw = vi
      .fn()
      .mockResolvedValue([candidate('u1'), candidate('u2'), candidate('u3')]);
    const findMany = vi.fn().mockResolvedValue([listRow({ id: 'u1' }), listRow({ id: 'u2' })]);
    const result = await listAccessibleInternalConversations(
      {
        $queryRaw: queryRaw,
        messengerConversation: { findMany },
        resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      'e1',
      'ALL',
      { filter: 'unread', pageSize },
    );
    expect(queryRaw).toHaveBeenCalledTimes(1);
    const sql = JSON.stringify(queryRaw.mock.calls[0]?.[0] ?? '');
    expect(sql).toMatch(/LATERAL/i);
    expect(sql).toMatch(/latest\.created_at/i);
    expect(result.items.map((row) => row.id)).toEqual(['u1', 'u2']);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(encodeMessengerListCursor(candidate('u2')));
  });

  it('keeps equal-timestamp unread continuation deterministic', async () => {
    const stamp = new Date('2026-09-05T12:00:00.000Z');
    const idA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa1';
    const idB = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa2';
    const idC = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa3';
    const queryRaw = vi
      .fn()
      .mockResolvedValueOnce([candidate(idA, stamp), candidate(idB, stamp), candidate(idC, stamp)])
      .mockResolvedValueOnce([candidate(idC, stamp)]);
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([
        listRow({ id: idA, lastMessageAt: stamp }),
        listRow({ id: idB, lastMessageAt: stamp }),
      ])
      .mockResolvedValueOnce([listRow({ id: idC, lastMessageAt: stamp })]);
    const first = await listAccessibleInternalConversations(
      {
        $queryRaw: queryRaw,
        messengerConversation: { findMany },
        resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      'e1',
      'ALL',
      { filter: 'unread', pageSize: 2 },
    );
    const second = await listAccessibleInternalConversations(
      {
        $queryRaw: queryRaw,
        messengerConversation: { findMany },
        resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      'e1',
      'ALL',
      { filter: 'unread', pageSize: 2, cursor: first.nextCursor },
    );
    expect(first.items.map((row) => row.id)).toEqual([idA, idB]);
    expect(second.items.map((row) => row.id)).toEqual([idC]);
    expect(new Set([...first.items, ...second.items].map((row) => row.id)).size).toBe(3);
  });

  it('keeps a forward cursor when hydration removes every candidate', async () => {
    const idA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa1';
    const idB = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa2';
    const idC = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa3';
    const queryRaw = vi
      .fn()
      .mockResolvedValue([candidate(idA), candidate(idB), candidate(idC)]);
    const result = await listAccessibleInternalConversations(
      {
        $queryRaw: queryRaw,
        messengerConversation: { findMany: vi.fn().mockResolvedValue([]) },
        resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      'e1',
      'ALL',
      { filter: 'unread', pageSize: 2 },
    );
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(encodeMessengerListCursor(candidate(idB)));
  });

  it('keeps the raw-page cursor after partial hydration removal', async () => {
    const idA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa1';
    const idB = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa2';
    const idC = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa3';
    const result = await listAccessibleInternalConversations(
      {
        $queryRaw: vi.fn().mockResolvedValue([candidate(idA), candidate(idB), candidate(idC)]),
        messengerConversation: { findMany: vi.fn().mockResolvedValue([listRow({ id: idA })]) },
        resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      'e1',
      'ALL',
      { filter: 'unread', pageSize: 2 },
    );
    expect(result.items.map((row) => row.id)).toEqual([idA]);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(encodeMessengerListCursor(candidate(idB)));
  });

  it('omits a cursor when the raw unread page is exhausted', async () => {
    const result = await listAccessibleInternalConversations(
      {
        $queryRaw: vi.fn().mockResolvedValue([candidate('u1')]),
        messengerConversation: { findMany: vi.fn().mockResolvedValue([]) },
        resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      'e1',
      'ALL',
      { filter: 'unread', pageSize: 2 },
    );
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });
});
