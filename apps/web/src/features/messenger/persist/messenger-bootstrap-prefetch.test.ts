import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { seedInternalMessengerBootstrap } from '../query/seed-messenger-bootstrap';
import { messengerTestCheckpoint } from '../query/messenger-test-checkpoint';
import { MESSENGER_QUERY_STALE_TIME_MS } from '../query/messenger-query-policy';
import {
  messengerZoneFromNavKey,
  prefetchMessengerBootstrapForNavKey,
  prefetchMessengerZoneBootstrap,
} from './messenger-bootstrap-prefetch';
import { resetMessengerPersistSessionForTests } from './messenger-persist-session';
import { settleMessengerPersistReadyForTests } from './messenger-persist-ready';

const bootstrapInternal = vi.fn();

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: {
    bootstrap: (...args: unknown[]) => bootstrapInternal(...args),
  },
}));

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: { bootstrap: vi.fn() },
}));

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function ageDefaultCache(queryClient: QueryClient): void {
  const stamped = Date.now() - MESSENGER_QUERY_STALE_TIME_MS - 1;
  for (const query of queryClient.getQueryCache().getAll()) {
    query.setState({ dataUpdatedAt: stamped });
  }
}

describe('Messenger bootstrap prefetch', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
    bootstrapInternal.mockReset();
  });

  it('maps only Messenger nav keys to zones', () => {
    expect(messengerZoneFromNavKey('messenger')).toBe('INTERNAL');
    expect(messengerZoneFromNavKey('client-messenger')).toBe('CLIENT');
    expect(messengerZoneFromNavKey('tasks')).toBeNull();
  });

  it('skips prefetch when restored cache or hydration is in progress', async () => {
    const queryClient = createClient();
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [{ id: 'cached' } as never], mentionsAvailable: true },
      collections: [{ id: 'col-1', name: 'Favorites' } as never],
      ...messengerTestCheckpoint(),
    });
    ageDefaultCache(queryClient);
    expect(prefetchMessengerZoneBootstrap(queryClient, 'INTERNAL')).toBeUndefined();
    expect(bootstrapInternal).not.toHaveBeenCalled();

    const cold = createClient();
    expect(prefetchMessengerZoneBootstrap(cold, 'INTERNAL')).toBeUndefined();
    expect(bootstrapInternal).not.toHaveBeenCalled();
    expect(prefetchMessengerBootstrapForNavKey(cold, 'tasks')).toBeUndefined();
  });

  it('dedupes concurrent cold prefetch to one bootstrap request', async () => {
    bootstrapInternal.mockResolvedValue({
      summaries: { items: [] },
      collections: [],
      ...messengerTestCheckpoint(),
    });
    settleMessengerPersistReadyForTests();
    const queryClient = createClient();
    const first = prefetchMessengerZoneBootstrap(queryClient, 'INTERNAL');
    const second = prefetchMessengerZoneBootstrap(queryClient, 'INTERNAL');
    expect(first).toBe(second);
    await Promise.all([first, second]);
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(messengerQueryKeys.messages('x'))).toBeUndefined();
  });
});
