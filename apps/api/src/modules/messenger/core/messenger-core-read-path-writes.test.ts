import { describe, expect, it, vi } from 'vitest';
import { MessengerCoreInternalService } from './messenger-core-internal.service';
import { MessengerCoreClientService } from './messenger-core-client.service';
import { MessengerCoreCollectionService } from './messenger-core-collection.service';
import { listAccessibleInternalConversations } from './messenger-core-internal-list.ops';
import { listAccessibleClientConversations } from './messenger-core-client-list.ops';
import { instrumentPrismaDelegates } from './messenger-prisma-call-count';

const ensureInternalFavoritesCollection = vi.fn();
const ensureClientFavoritesCollection = vi.fn();

vi.mock('./messenger-core-favorites-ensure.ops', () => ({
  ensureInternalFavoritesCollection: (...args: unknown[]) =>
    ensureInternalFavoritesCollection(...args),
  ensureClientFavoritesCollection: (...args: unknown[]) => ensureClientFavoritesCollection(...args),
}));

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: vi.fn(async () => ({
    employeeId: 'e1',
    departmentIds: [],
    viewScope: 'ALL',
    editScope: 'ALL',
    clientReadScope: 'ALL',
    clientSendScope: 'ALL',
    driveViewScope: 'ALL',
  })),
}));

function grantAndConversationPrisma() {
  return {
    messengerConversation: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    messengerConversationCollection: { findMany: vi.fn().mockResolvedValue([]) },
    messengerConversationCollectionItem: { findMany: vi.fn().mockResolvedValue([]) },
    $queryRaw: vi.fn().mockResolvedValue([]),
  };
}

describe('Phase 6 GET/read paths do not provision', () => {
  it('Internal and Client list ops issue zero mutating Prisma calls', async () => {
    const internal = instrumentPrismaDelegates(grantAndConversationPrisma());
    await listAccessibleInternalConversations(
      internal.prisma as never,
      'e1',
      'ALL',
      { section: 'all' },
      'ALL',
    );
    expect(internal.snapshot().mutating).toBe(0);
    const client = instrumentPrismaDelegates(grantAndConversationPrisma());
    await listAccessibleClientConversations(client.prisma as never, 'e1', 'ALL', 'ALL', {
      section: 'inbox',
    });
    expect(client.snapshot().mutating).toBe(0);
  });

  it('GET conversation lists do not call Favorites ensure', async () => {
    ensureInternalFavoritesCollection.mockReset();
    ensureClientFavoritesCollection.mockReset();
    const prisma = grantAndConversationPrisma();
    const internal = new MessengerCoreInternalService(
      prisma as never,
      {
        getConversation: vi.fn(),
        persistAndBroadcast: vi.fn(),
        markRead: vi.fn(),
        createConversation: vi.fn(),
      } as never,
      { forwardMessages: vi.fn() } as never,
    );
    await internal.listConversations('e1', { section: 'all' });
    expect(ensureInternalFavoritesCollection).not.toHaveBeenCalled();
    const client = new MessengerCoreClientService(
      prisma as never,
      { getConversation: vi.fn(), persistAndBroadcast: vi.fn(), markRead: vi.fn() } as never,
    );
    await client.listConversations('e1', { section: 'inbox' });
    expect(ensureClientFavoritesCollection).not.toHaveBeenCalled();
  });

  it('GET collection lists do not call Favorites ensure', async () => {
    ensureInternalFavoritesCollection.mockReset();
    ensureClientFavoritesCollection.mockReset();
    const collections = new MessengerCoreCollectionService(grantAndConversationPrisma() as never);
    await collections.listInternal('e1');
    await collections.listClient('e1');
    expect(ensureInternalFavoritesCollection).not.toHaveBeenCalled();
    expect(ensureClientFavoritesCollection).not.toHaveBeenCalled();
  });
});
