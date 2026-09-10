import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { seedInternalMessengerBootstrap } from '../query/seed-messenger-bootstrap';
import { messengerTestCheckpoint } from '../query/messenger-test-checkpoint';
import { createMemoryMessengerPersistBackend } from './messenger-persist-idb';
import {
  commitMessengerPersistCapture,
  shouldReplacePersistedEnvelope,
} from './messenger-persist-write';
import { captureMessengerPersistSnapshot } from './messenger-persist-snapshot';
import {
  beginMessengerPersistHydration,
  bindMessengerPersistQueryClient,
  noteMessengerPersistCapturedAt,
  purgeMessengerPersistForSignOut,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';
import { parseMessengerPersistEnvelope } from './messenger-persist-envelope';
import { MESSENGER_CACHE_SCHEMA_VERSION } from './messenger-persist.constants';
import { persistTestCollection, persistTestInternalPage } from './messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';
const OTHER = 'employee-user-bbbb';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function storedEnvelope(capturedAt: number, collectionId: string) {
  return {
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
    identityId: IDENTITY,
    capturedAt,
    writtenAt: capturedAt,
    queries: [
      {
        queryKey: [...messengerQueryKeys.collections('INTERNAL')],
        dataUpdatedAt: capturedAt - 2_000,
        data: [persistTestCollection(collectionId)],
      },
    ],
    checkpoints: {},
  };
}

describe('Messenger persist writes and isolation', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
  });

  it('persists settled summaries and collections, not messages or mutations', () => {
    const queryClient = createClient();
    seedInternalMessengerBootstrap(queryClient, {
      summaries: persistTestInternalPage('c1'),
      collections: [persistTestCollection()],
      ...messengerTestCheckpoint(),
    });
    queryClient.setQueryData(messengerQueryKeys.messages('c1'), { items: [{ id: 'm1', content: 'secret' }] });
    const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, Date.now() + 1);
    expect(capture).not.toBeNull();
    const keys = capture?.envelope.queries.map((record) => record.queryKey) ?? [];
    expect(keys).toContainEqual([...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })]);
    expect(keys).toContainEqual([...messengerQueryKeys.collections('INTERNAL')]);
    expect(keys.some((key) => key[1] === 'messages')).toBe(false);
    expect(JSON.stringify(capture)).not.toContain('secret');
  });

  it('rejects an older capture after a newer envelope is stored', async () => {
    const now = Date.now();
    const backend = createMemoryMessengerPersistBackend();
    const newer = storedEnvelope(now, 'col-new');
    await backend.write(IDENTITY, JSON.stringify(newer));
    expect(shouldReplacePersistedEnvelope(newer, { identityId: IDENTITY, capturedAt: now - 5_000 })).toBe(
      false,
    );
    noteMessengerPersistCapturedAt(IDENTITY, now);
    const queryClient = createClient();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    queryClient.setQueryData(
      messengerQueryKeys.collections('INTERNAL'),
      [persistTestCollection('col-old', 'Old')],
      { updatedAt: now - 6_000 },
    );
    const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, now - 5_000);
    expect(capture).not.toBeNull();
    if (!capture) return;
    const replaced = await commitMessengerPersistCapture(backend, capture, IDENTITY, generation, null);
    expect(replaced).toBe(false);
    const stored = parseMessengerPersistEnvelope(
      JSON.parse((await backend.read(IDENTITY)) ?? 'null'),
      IDENTITY,
      Date.now(),
    );
    expect(stored?.queries[0]?.data).toEqual([persistTestCollection('col-new')]);
  });

  it('keeps the first write when capturedAt is equal', async () => {
    const capturedAt = Date.now() - 1_000;
    const backend = createMemoryMessengerPersistBackend();
    await backend.write(IDENTITY, JSON.stringify(storedEnvelope(capturedAt, 'col-first')));
    const queryClient = createClient();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    queryClient.setQueryData(
      messengerQueryKeys.collections('INTERNAL'),
      [persistTestCollection('col-second', 'Second')],
      { updatedAt: capturedAt - 1 },
    );
    const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, capturedAt);
    expect(capture).not.toBeNull();
    if (!capture) return;
    expect(await commitMessengerPersistCapture(backend, capture, IDENTITY, generation, null)).toBe(false);
    const stored = parseMessengerPersistEnvelope(
      JSON.parse((await backend.read(IDENTITY)) ?? 'null'),
      IDENTITY,
      Date.now(),
    );
    expect(stored?.queries[0]?.data).toEqual([persistTestCollection('col-first')]);
  });

  it('does not share envelopes across identities and purge deletes the old record', async () => {
    const backend = createMemoryMessengerPersistBackend();
    await backend.write(IDENTITY, JSON.stringify({ identityId: IDENTITY }));
    await backend.write(OTHER, JSON.stringify({ identityId: OTHER }));
    const queryClient = createClient();
    bindMessengerPersistQueryClient(queryClient);
    queryClient.setQueryData(messengerQueryKeys.collections('INTERNAL'), [persistTestCollection()]);
    purgeMessengerPersistForSignOut();
    await backend.delete(IDENTITY);
    expect(await backend.read(IDENTITY)).toBeNull();
    expect(await backend.read(OTHER)).not.toBeNull();
    expect(queryClient.getQueryData(messengerQueryKeys.collections('INTERNAL'))).toBeUndefined();
  });
});
