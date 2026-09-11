import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usesSharedInternalAllDataset } from '@/features/messenger/query/derive-internal-summaries';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import {
  isMessengerDefaultCacheFresh,
  seedInternalMessengerBootstrap,
} from '@/features/messenger/query/seed-messenger-bootstrap';
import { toggleInternalFavorite } from '@/features/messenger-internal/internal-messenger-cache-ops';
import { messengerTestCheckpoint } from '@/features/messenger/query/messenger-test-checkpoint';
import {
  ensureMessengerBootstrap,
  runMessengerBootstrap,
} from '@/features/messenger/query/use-messenger-bootstrap';

const bootstrapInternal = vi.fn();
const bootstrapClient = vi.fn();
const listConversations = vi.fn();
const listCollections = vi.fn();
const toggleFavorite = vi.fn();

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: {
    bootstrap: (...args: unknown[]) => bootstrapInternal(...args),
    listConversations: (...args: unknown[]) => listConversations(...args),
    listCollections: (...args: unknown[]) => listCollections(...args),
    toggleFavorite: (...args: unknown[]) => toggleFavorite(...args),
  },
}));

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: {
    bootstrap: (...args: unknown[]) => bootstrapClient(...args),
  },
}));

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('Messenger bootstrap cache seeding', () => {
  beforeEach(() => {
    bootstrapInternal.mockReset();
    listConversations.mockReset();
    listCollections.mockReset();
    toggleFavorite.mockReset();
  });

  it('seeds canonical Internal summary and collection keys', async () => {
    const queryClient = createClient();
    const summaries = { items: [{ id: 'i1' }], mentionsAvailable: true };
    const collections = [{ id: 'col-1', name: 'Watch' }];
    bootstrapInternal.mockResolvedValue({ summaries, collections, ...messengerTestCheckpoint() });
    await runMessengerBootstrap(queryClient, 'INTERNAL');
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(summaries);
    expect(queryClient.getQueryData(messengerQueryKeys.collections('INTERNAL'))).toEqual(
      collections,
    );
    expect(listConversations).not.toHaveBeenCalled();
    expect(listCollections).not.toHaveBeenCalled();
  });

  it('dedupes concurrent bootstrap work to one request', async () => {
    const queryClient = createClient();
    let resolveBootstrap: (value: unknown) => void = () => undefined;
    bootstrapInternal.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBootstrap = resolve;
        }),
    );
    const first = ensureMessengerBootstrap(queryClient, 'INTERNAL');
    const second = ensureMessengerBootstrap(queryClient, 'INTERNAL');
    resolveBootstrap({ summaries: { items: [] }, collections: [], ...messengerTestCheckpoint() });
    await Promise.all([first, second]);
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
  });

  it('preserves existing canonical data when bootstrap fails', async () => {
    const queryClient = createClient();
    const summaries = { items: [{ id: 'cached' }], mentionsAvailable: true };
    const collections = [{ id: 'col-cached' }];
    seedInternalMessengerBootstrap(queryClient, {
      summaries,
      collections,
      ...messengerTestCheckpoint(),
    } as never);
    bootstrapInternal.mockRejectedValue(new Error('bootstrap down'));
    await expect(runMessengerBootstrap(queryClient, 'INTERNAL')).rejects.toThrow('bootstrap down');
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(summaries);
    expect(queryClient.getQueryData(messengerQueryKeys.collections('INTERNAL'))).toEqual(
      collections,
    );
  });

  it('treats seeded keys as fresh default cache', () => {
    const queryClient = createClient();
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [], mentionsAvailable: true },
      collections: [],
      ...messengerTestCheckpoint(),
    });
    expect(isMessengerDefaultCacheFresh(queryClient, 'INTERNAL')).toBe(true);
  });

  it('keeps search, mentions, unread, and collection detail off the default bootstrap identity', () => {
    expect(usesSharedInternalAllDataset('all', '', 'all')).toBe(true);
    expect(usesSharedInternalAllDataset('all', 'q', 'all')).toBe(false);
    expect(usesSharedInternalAllDataset('all', '', 'mentions')).toBe(false);
    expect(usesSharedInternalAllDataset('all', '', 'unread')).toBe(false);
    expect(messengerQueryKeys.collectionDetail('INTERNAL', 'col-1')).not.toEqual(
      messengerQueryKeys.collections('INTERNAL'),
    );
  });

  it('invalidates zone collection cache after a favorite toggle', async () => {
    const queryClient = createClient();
    const collectionsKey = messengerQueryKeys.collections('INTERNAL');
    const detailKey = messengerQueryKeys.collectionDetail('INTERNAL', 'fav-1');
    queryClient.setQueryData(collectionsKey, []);
    queryClient.setQueryData(detailKey, { id: 'fav-1', conversations: [] });
    toggleFavorite.mockResolvedValue({ favorite: true, collectionId: 'fav-1' });
    await toggleInternalFavorite(queryClient, 'conv-1');
    expect(queryClient.getQueryState(collectionsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
  });
});
