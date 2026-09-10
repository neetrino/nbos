import { describe, expect, it, vi } from 'vitest';
import {
  listCollectionItemIds,
  listInternalCollections,
} from './messenger-core-collection-list.ops';
import { ensureInternalFavoritesCollection } from './messenger-core-favorites-ensure.ops';
import { backfillFavoritesFromSettings } from './messenger-core-favorites-backfill.ops';

vi.mock('./messenger-core-internal-list.ops', () => ({
  listAccessibleInternalConversationsByIds: vi.fn(
    async (_prisma: unknown, _employeeId: string, _scope: string, ids: string[]) =>
      ids.filter((id) => id !== 'hidden').map((id) => ({ id })),
  ),
}));

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: vi.fn(async () => ({
    employeeId: 'e1',
    departmentIds: [],
    viewScope: 'ALL',
    editScope: 'ALL',
    clientReadScope: 'NONE',
    clientSendScope: 'NONE',
    tasksViewScope: 'ALL',
  })),
}));

const FAVORITES = {
  id: 'fav-1',
  name: 'Favorites',
  visibility: 'PERSONAL' as const,
  zone: 'INTERNAL' as const,
  ownerEmployeeId: 'e1',
};

function favoritesPrisma(initial: typeof FAVORITES | null) {
  let stored = initial;
  let queue = Promise.resolve();
  const create = vi.fn().mockImplementation(async (args: { data: typeof FAVORITES }) => {
    stored = {
      id: 'fav-1',
      name: args.data.name,
      visibility: args.data.visibility,
      zone: args.data.zone,
      ownerEmployeeId: args.data.ownerEmployeeId,
    };
    return stored;
  });
  const createMany = vi.fn().mockResolvedValue({ count: 1 });
  const settingsFind = vi.fn().mockResolvedValue([{ conversationId: 'conv-1' }]);
  const prisma = {
    $executeRaw: vi.fn().mockResolvedValue(undefined),
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => {
      const run = queue.then(() => fn(prisma));
      queue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
    messengerConversationCollection: {
      findFirst: vi.fn().mockImplementation(async () => stored),
      create,
      findMany: vi.fn().mockResolvedValue([]),
    },
    messengerUserConversationSetting: { findMany: settingsFind },
    messengerConversationCollectionItem: { createMany, upsert: vi.fn() },
    messengerConversation: { findMany: vi.fn() },
  };
  return { prisma, create, createMany, settingsFind };
}

describe('Internal collection list semantics', () => {
  it('creates Favorites once and backfills settings with createMany, not per-item upserts', async () => {
    const { prisma, create, createMany } = favoritesPrisma(null);
    const created = await ensureInternalFavoritesCollection(prisma as never, 'e1');
    expect(created.name).toBe('Favorites');
    expect(create).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createMany.mock.calls[0]?.[0]?.skipDuplicates).toBe(true);
    expect(prisma.messengerConversationCollectionItem.upsert).not.toHaveBeenCalled();
  });

  it('backfills an existing Favorites collection without creating a duplicate', async () => {
    const { prisma, create, createMany, settingsFind } = favoritesPrisma(FAVORITES);
    const again = await ensureInternalFavoritesCollection(prisma as never, 'e1');
    expect(again.id).toBe('fav-1');
    expect(create).not.toHaveBeenCalled();
    expect(settingsFind).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledTimes(1);
  });

  it('retries backfill after a failed initialization', async () => {
    const { prisma, createMany } = favoritesPrisma(FAVORITES);
    createMany.mockRejectedValueOnce(new Error('backfill down')).mockResolvedValueOnce({ count: 1 });
    await expect(ensureInternalFavoritesCollection(prisma as never, 'e1')).rejects.toThrow(
      'backfill down',
    );
    await expect(ensureInternalFavoritesCollection(prisma as never, 'e1')).resolves.toMatchObject({
      id: 'fav-1',
    });
    expect(createMany).toHaveBeenCalledTimes(2);
  });

  it('serializes concurrent ensure to one Favorites identity', async () => {
    const { prisma, create } = favoritesPrisma(null);
    const [first, second] = await Promise.all([
      ensureInternalFavoritesCollection(prisma as never, 'e1'),
      ensureInternalFavoritesCollection(prisma as never, 'e1'),
    ]);
    expect(first.id).toBe(second.id);
    expect(create).toHaveBeenCalledTimes(1);
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('lists collections without writes on repeated reads', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      messengerConversationCollection: { findMany },
      messengerConversationCollectionItem: { createMany: vi.fn(), upsert: vi.fn() },
    };
    await listInternalCollections(prisma as never, 'e1');
    await listInternalCollections(prisma as never, 'e1');
    expect(findMany).toHaveBeenCalledTimes(2);
    expect(prisma.messengerConversationCollectionItem.createMany).not.toHaveBeenCalled();
    expect(prisma.messengerConversationCollectionItem.upsert).not.toHaveBeenCalled();
  });

  it('loads collection item ids with a stable createdAt/id order', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { conversationId: 'third' },
      { conversationId: 'second' },
      { conversationId: 'first' },
    ]);
    const ids = await listCollectionItemIds(
      { messengerConversationCollectionItem: { findMany } } as never,
      'col-shared',
      'INTERNAL',
    );
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0]?.[0]?.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
    expect(ids).toEqual(['third', 'second', 'first']);
  });

  it('backfills Favorites set-based and excludes unauthorized ids', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const settingsFind = vi.fn().mockResolvedValue([
      { conversationId: 'visible-a' },
      { conversationId: 'hidden' },
      { conversationId: 'visible-b' },
    ]);
    const count = await backfillFavoritesFromSettings(
      {
        messengerUserConversationSetting: { findMany: settingsFind },
        messengerConversationCollectionItem: { createMany, upsert: vi.fn() },
      } as never,
      'e1',
      'fav-1',
      'INTERNAL',
    );
    expect(settingsFind).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createMany.mock.calls[0]?.[0]?.data).toEqual([
      { collectionId: 'fav-1', conversationId: 'visible-a' },
      { collectionId: 'fav-1', conversationId: 'visible-b' },
    ]);
    expect(count).toBe(2);
  });
});
