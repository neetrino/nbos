import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { messengerTestCheckpoint } from '../query/messenger-test-checkpoint';
import { createMemoryMessengerPersistBackend } from './messenger-persist-idb';
import {
  hydrateMessengerPersistCache,
  restoreSerializedEnvelope,
  setMessengerPersistBackendForTests,
} from './messenger-persist-controller';
import {
  MESSENGER_CACHE_SCHEMA_VERSION,
  MESSENGER_PERSISTENCE_MAX_AGE_MS,
} from './messenger-persist.constants';
import { resetMessengerPersistSessionForTests } from './messenger-persist-session';
import { showMessengerListPlaceholder } from '../query/derive-internal-summaries';
import { persistTestCollection, persistTestInternalPage } from './messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function validSerialized(writtenAt = Date.now() - 1_000): string {
  return JSON.stringify({
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
    identityId: IDENTITY,
    capturedAt: writtenAt,
    writtenAt,
    queries: [
      {
        queryKey: [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
        dataUpdatedAt: writtenAt - 1_000,
        data: persistTestInternalPage('restored'),
      },
      {
        queryKey: [...messengerQueryKeys.collections('INTERNAL')],
        dataUpdatedAt: writtenAt - 1_000,
        data: [persistTestCollection()],
      },
    ],
    checkpoints: {
      INTERNAL: {
        checkpoint: '4',
        authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
      },
    },
  });
}

describe('Messenger persist controller', () => {
  afterEach(() => {
    setMessengerPersistBackendForTests(null);
    resetMessengerPersistSessionForTests();
  });

  it('hydrates a valid same-user envelope without blanking later list state', async () => {
    const backend = createMemoryMessengerPersistBackend({ [IDENTITY]: validSerialized() });
    setMessengerPersistBackendForTests(backend);
    const queryClient = createClient();
    await hydrateMessengerPersistCache(queryClient, IDENTITY);
    const data = queryClient.getQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
    );
    expect(data).toEqual(persistTestInternalPage('restored'));
    expect(showMessengerListPlaceholder(data, true)).toBe(false);
  });

  it('deletes expired, malformed, and wrong-user records instead of restoring', async () => {
    const expired = validSerialized(Date.now() - MESSENGER_PERSISTENCE_MAX_AGE_MS - 5_000);
    const backend = createMemoryMessengerPersistBackend({
      [IDENTITY]: expired,
    });
    setMessengerPersistBackendForTests(backend);
    const queryClient = createClient();
    await hydrateMessengerPersistCache(queryClient, IDENTITY);
    expect(await backend.read(IDENTITY)).toBeNull();
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();

    await backend.write(IDENTITY, '{not-json');
    await restoreSerializedEnvelope(queryClient, IDENTITY, '{not-json', Date.now(), 0);
    expect(await backend.read(IDENTITY)).toBeNull();
  });

  it('falls back when the backend read fails without throwing', async () => {
    setMessengerPersistBackendForTests({
      read: async () => {
        throw new Error('quota');
      },
      write: async () => {
        throw new Error('quota');
      },
      compareAndWrite: async () => {
        throw new Error('quota');
      },
      delete: async () => {
        throw new Error('quota');
      },
      clear: async () => {
        throw new Error('quota');
      },
    });
    const queryClient = createClient();
    await expect(hydrateMessengerPersistCache(queryClient, IDENTITY)).resolves.toBeUndefined();
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();
  });
});
