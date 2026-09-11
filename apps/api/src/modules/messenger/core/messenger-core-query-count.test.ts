import { describe, expect, it, vi } from 'vitest';
import { listAccessibleInternalConversations } from './messenger-core-internal-list.ops';
import { listAccessibleClientConversations } from './messenger-core-client-list.ops';
import {
  listInternalCollections,
  listClientCollections,
} from './messenger-core-collection-list.ops';
import {
  loadInternalMessengerBootstrap,
  loadClientMessengerBootstrap,
} from './messenger-core-bootstrap.ops';
import { instrumentPrismaDelegates } from './messenger-prisma-call-count';
import { takeListPagePlusOne } from './messenger-core-list-page';
import { MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE } from './messenger-core.constants';

const INTERNAL_DEFAULT_QUERIES = 2;
const CLIENT_DEFAULT_QUERIES = 2;
const INTERNAL_UNREAD_QUERIES = 3;
const CLIENT_FILTERED_QUERIES = 3;
const COLLECTION_LIST_QUERIES = 1;
const BOOTSTRAP_DEFAULT_READ_QUERIES = 3;

const INTERNAL_ACCESS = {
  employeeId: 'e1',
  viewScope: 'ALL',
  editScope: 'ALL',
  clientReadScope: 'NONE',
  clientSendScope: 'NONE',
  zone: 'INTERNAL' as const,
};

const CLIENT_ACCESS = {
  employeeId: 'e1',
  viewScope: 'NONE',
  editScope: 'NONE',
  clientReadScope: 'ALL',
  clientSendScope: 'ALL',
  zone: 'CLIENT' as const,
};

vi.mock('./messenger-core-favorites-ensure.ops', () => ({
  ensureInternalFavoritesCollection: vi.fn(async () => ({
    id: 'fav-i',
    name: 'Favorites',
    visibility: 'PERSONAL',
    zone: 'INTERNAL',
    ownerEmployeeId: 'e1',
  })),
  ensureClientFavoritesCollection: vi.fn(async () => ({
    id: 'fav-c',
    name: 'Favorites',
    visibility: 'PERSONAL',
    zone: 'CLIENT',
    ownerEmployeeId: 'e1',
  })),
}));

function internalRow(id: string) {
  return {
    id,
    zone: 'INTERNAL',
    type: 'INTERNAL_GROUP',
    title: id,
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    lastMessageAt: new Date('2026-08-30T12:00:00.000Z'),
    messages: [
      { content: 'hello', senderId: 'other', createdAt: new Date('2026-08-30T12:00:00.000Z') },
    ],
    readStates: [],
    userSettings: [],
    participants: [],
  };
}

function clientRow(id: string) {
  return {
    id,
    zone: 'CLIENT',
    type: 'EXTERNAL',
    title: id,
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
    readStates: [],
    userSettings: [],
    participants: [{ role: 'MEMBER' }],
    externalMappings: [],
    links: [],
    productCommunicationBindings: [],
    attentions: [],
  };
}

function listPrisma(rows: unknown[], extra?: { queryRaw?: unknown[] }) {
  return {
    messengerConversation: { findMany: vi.fn().mockResolvedValue(rows) },
    resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    messengerConversationCollection: { findMany: vi.fn().mockResolvedValue([]) },
    $queryRaw: vi.fn().mockResolvedValue(extra?.queryRaw ?? []),
  };
}

describe('Phase 6 Messenger Prisma query counts', () => {
  it('Internal default list stays at two queries regardless of row cardinality', async () => {
    const small = instrumentPrismaDelegates(listPrisma([internalRow('a'), internalRow('b')]));
    await listAccessibleInternalConversations(
      small.prisma as never,
      'e1',
      'ALL',
      { section: 'all' },
      'ALL',
    );
    expect(small.snapshot().total).toBe(INTERNAL_DEFAULT_QUERIES);
    expect(small.snapshot().mutating).toBe(0);
    const largeRows = Array.from({ length: 80 }, (_, i) => internalRow(`c${i}`));
    const large = instrumentPrismaDelegates(listPrisma(largeRows));
    await listAccessibleInternalConversations(
      large.prisma as never,
      'e1',
      'ALL',
      { section: 'all' },
      'ALL',
    );
    expect(large.snapshot().total).toBe(INTERNAL_DEFAULT_QUERIES);
    expect(large.snapshot().byPath['messengerConversation.findMany']).toBe(1);
    expect(takeListPagePlusOne(MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE)).toBe(101);
  });

  it('Client default list stays at two queries regardless of row cardinality', async () => {
    const small = instrumentPrismaDelegates(listPrisma([clientRow('a')]));
    await listAccessibleClientConversations(small.prisma as never, 'e1', 'ALL', 'ALL', {
      section: 'inbox',
    });
    expect(small.snapshot().total).toBe(CLIENT_DEFAULT_QUERIES);
    expect(small.snapshot().mutating).toBe(0);
    const large = instrumentPrismaDelegates(
      listPrisma(Array.from({ length: 80 }, (_, i) => clientRow(`c${i}`))),
    );
    await listAccessibleClientConversations(large.prisma as never, 'e1', 'ALL', 'ALL', {
      section: 'inbox',
    });
    expect(large.snapshot().total).toBe(CLIENT_DEFAULT_QUERIES);
  });

  it('Internal unread pagination is three bounded queries, not per-row loops', async () => {
    const ids = [{ id: 'u1', lastMessageAt: new Date(), createdAt: new Date() }];
    const counted = instrumentPrismaDelegates(listPrisma([internalRow('u1')], { queryRaw: ids }));
    await listAccessibleInternalConversations(
      counted.prisma as never,
      'e1',
      'ALL',
      { section: 'all', filter: 'unread' },
      'ALL',
    );
    expect(counted.snapshot().total).toBe(INTERNAL_UNREAD_QUERIES);
    expect(counted.snapshot().byPath.$queryRaw).toBe(1);
    expect(counted.snapshot().mutating).toBe(0);
  });

  it('Client unread and needs_response pagination stay at three queries', async () => {
    const ids = [{ id: 'u1', lastMessageAt: new Date(), createdAt: new Date() }];
    const unread = instrumentPrismaDelegates(listPrisma([clientRow('u1')], { queryRaw: ids }));
    await listAccessibleClientConversations(unread.prisma as never, 'e1', 'ALL', 'ALL', {
      filter: 'unread',
    });
    expect(unread.snapshot().total).toBe(CLIENT_FILTERED_QUERIES);
    const needs = instrumentPrismaDelegates(listPrisma([clientRow('u1')], { queryRaw: ids }));
    await listAccessibleClientConversations(needs.prisma as never, 'e1', 'ALL', 'ALL', {
      filter: 'needs_response',
    });
    expect(needs.snapshot().total).toBe(CLIENT_FILTERED_QUERIES);
    expect(needs.snapshot().mutating).toBe(0);
  });

  it('collection lists are one findMany and never provision Favorites', async () => {
    const internal = instrumentPrismaDelegates(listPrisma([]));
    await listInternalCollections(internal.prisma as never, 'e1');
    expect(internal.snapshot().total).toBe(COLLECTION_LIST_QUERIES);
    expect(internal.snapshot().mutating).toBe(0);
    const client = instrumentPrismaDelegates(listPrisma([]));
    await listClientCollections(client.prisma as never, 'e1');
    expect(client.snapshot().total).toBe(COLLECTION_LIST_QUERIES);
  });

  it('bootstrap default-list aggregation is three reads when Favorites ensure is mocked', async () => {
    // Complete POST bootstrap provisioning (unmocked Favorites) is in
    // messenger-core-bootstrap-query-count.test.ts.
    const previous = process.env.MESSENGER_DELTA_RECOVERY_ENABLED;
    delete process.env.MESSENGER_DELTA_RECOVERY_ENABLED;
    try {
      const internal = instrumentPrismaDelegates(listPrisma([internalRow('i1')]));
      await loadInternalMessengerBootstrap(internal.prisma as never, INTERNAL_ACCESS);
      expect(internal.snapshot().total).toBe(BOOTSTRAP_DEFAULT_READ_QUERIES);
      expect(internal.snapshot().mutating).toBe(0);
      const client = instrumentPrismaDelegates(listPrisma([clientRow('c1')]));
      await loadClientMessengerBootstrap(client.prisma as never, CLIENT_ACCESS);
      expect(client.snapshot().total).toBe(BOOTSTRAP_DEFAULT_READ_QUERIES);
    } finally {
      if (previous === undefined) delete process.env.MESSENGER_DELTA_RECOVERY_ENABLED;
      else process.env.MESSENGER_DELTA_RECOVERY_ENABLED = previous;
    }
  });
});
