import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { applyMessengerPersistSessionIdentity } from './messenger-persist-boundary';
import { createMemoryMessengerPersistBackend } from './messenger-persist-idb';
import {
  getMessengerPersistQueryEnabled,
  registerMessengerPersistHost,
  resetMessengerPersistReadyForTests,
} from './messenger-persist-ready';
import {
  bindMessengerPersistQueryClient,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';
import { hydrateMessengerPersistCache, persistMessengerCacheNow, setMessengerPersistBackendForTests } from './messenger-persist-controller';
import { persistTestInternalPage } from './messenger-persist-test-dto';

const PERSISTABLE = 'employee-user-aaaa';
const NON_PERSISTABLE = 'ab';

describe('Messenger persist non-persistable identity', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
    resetMessengerPersistReadyForTests();
    setMessengerPersistBackendForTests(null);
  });

  it('settles an authenticated non-persistable identity without using it as an IDB key', async () => {
    const reads: string[] = [];
    const writes: string[] = [];
    const backend = createMemoryMessengerPersistBackend();
    setMessengerPersistBackendForTests({
      read: async (identityId) => {
        reads.push(identityId);
        return backend.read(identityId);
      },
      write: async (identityId, serialized) => {
        writes.push(identityId);
        return backend.write(identityId, serialized);
      },
      compareAndWrite: async (input) => {
        writes.push(input.identityId);
        return backend.compareAndWrite(input);
      },
      delete: async (identityId) => backend.delete(identityId),
      clear: async () => backend.clear(),
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    bindMessengerPersistQueryClient(queryClient);
    registerMessengerPersistHost();
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
      persistTestInternalPage('from-A'),
    );
    applyMessengerPersistSessionIdentity(queryClient, PERSISTABLE);
    applyMessengerPersistSessionIdentity(queryClient, NON_PERSISTABLE);
    expect(getMessengerPersistQueryEnabled()).toBe(true);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();
    await hydrateMessengerPersistCache(queryClient, NON_PERSISTABLE);
    expect(
      await persistMessengerCacheNow(queryClient, NON_PERSISTABLE, 1, null),
    ).toBe(false);
    expect(reads).not.toContain(NON_PERSISTABLE);
    expect(writes).not.toContain(NON_PERSISTABLE);
    expect(await backend.read(NON_PERSISTABLE)).toBeNull();
  });
});
