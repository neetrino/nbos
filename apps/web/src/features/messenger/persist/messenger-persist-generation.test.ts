import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { applyMessengerPersistEnvelope } from './messenger-persist-hydrate';
import { applyMessengerPersistSessionIdentity, shouldWithholdMessengerPersistChildren } from './messenger-persist-boundary';
import { ingestChannelMessage } from './messenger-persist-channel';
import {
  hydrateMessengerPersistCache,
  persistMessengerCacheNow,
  setMessengerPersistBackendForTests,
} from './messenger-persist-controller';
import { MESSENGER_CACHE_SCHEMA_VERSION, setMessengerPersistenceEnabledForTests } from './messenger-persist.constants';
import { createMemoryMessengerPersistBackend, type MessengerPersistBackend } from './messenger-persist-idb';
import {
  getMessengerPersistQueryEnabled,
  registerMessengerPersistHost,
  resetMessengerPersistReadyForTests,
} from './messenger-persist-ready';
import {
  bindMessengerPersistQueryClient,
  isMessengerPersistGenerationCurrent,
  readMessengerPersistChannelIdentity,
  readMessengerPersistGate,
  readMessengerPersistGeneration,
  readMessengerPersistLastSeenCapturedAt,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';
import { persistTestInternalPage } from './messenger-persist-test-dto';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { messengerTestCheckpoint } from '../query/messenger-test-checkpoint';
import { readMessengerHttpCheckpoint, writeMessengerHttpCheckpoint } from '../query/messenger-checkpoint-store';
import type { MessengerPersistEnvelope } from './messenger-persist-envelope';

const IDENTITY_A = 'employee-user-aaaa';
const IDENTITY_B_INVALID = 'ab';
const IDENTITY_B_VALID = 'employee-user-bbbb';
const IDENTITY_C = 'employee-user-cccc';
const NOW = 1_725_000_000_000;

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function serializedEnvelope(identityId: string, itemId: string): string {
  const capturedAt = Date.now() - 1_000;
  return JSON.stringify(restoredEnvelope(identityId, itemId, capturedAt));
}

function restoredEnvelope(
  identityId: string,
  itemId: string,
  capturedAt = Date.now() - 1_000,
): MessengerPersistEnvelope {
  return {
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
    identityId,
    capturedAt,
    writtenAt: capturedAt,
    queries: [
      {
        queryKey: [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
        dataUpdatedAt: capturedAt - 1_000,
        data: persistTestInternalPage(itemId),
      },
    ],
    checkpoints: {
      INTERNAL: {
        checkpoint: '4',
        authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
      },
    },
  };
}

function channelMessage(identityId: string) {
  return {
    identityId,
    capturedAt: NOW - 1_000,
    writtenAt: NOW - 500,
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
  };
}

function trackBackend(inner: MessengerPersistBackend) {
  const reads: string[] = [];
  const writes: string[] = [];
  const deletes: string[] = [];
  const backend: MessengerPersistBackend = {
    read: async (identityId) => {
      reads.push(identityId);
      return inner.read(identityId);
    },
    write: async (identityId, serialized) => {
      writes.push(identityId);
      return inner.write(identityId, serialized);
    },
    compareAndWrite: async (input) => {
      writes.push(input.identityId);
      return inner.compareAndWrite(input);
    },
    delete: async (identityId) => {
      deletes.push(identityId);
      return inner.delete(identityId);
    },
    clear: async () => inner.clear(),
  };
  return { backend, reads, writes, deletes };
}

function startSession(queryClient: QueryClient): void {
  bindMessengerPersistQueryClient(queryClient);
  registerMessengerPersistHost();
}

function createHold(): { latch: Promise<void>; release: () => void } {
  let release: () => void = () => undefined;
  const latch = new Promise<void>((resolve) => {
    release = () => {
      resolve();
    };
  });
  return { latch, release };
}

describe('Messenger persist generation revocation on identity switch', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
    resetMessengerPersistReadyForTests();
    setMessengerPersistBackendForTests(null);
  });

  it('ignores delayed A hydration after switch to invalid B and enables B queries', async () => {
    const hold = createHold();
    const inner = createMemoryMessengerPersistBackend({
      [IDENTITY_A]: serializedEnvelope(IDENTITY_A, 'from-A'),
    });
    const tracked = trackBackend({
      ...inner,
      read: async (identityId) => {
        const value = await inner.read(identityId);
        if (identityId === IDENTITY_A) await hold.latch;
        return value;
      },
    });
    setMessengerPersistBackendForTests(tracked.backend);
    const queryClient = createClient();
    startSession(queryClient);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_A);
    const generationA = readMessengerPersistGeneration();
    const pending = hydrateMessengerPersistCache(queryClient, IDENTITY_A);
    await Promise.resolve();
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_B_INVALID);
    expect(isMessengerPersistGenerationCurrent(generationA)).toBe(false);
    expect(readMessengerPersistGate(queryClient).identityId).toBe(IDENTITY_B_INVALID);
    expect(readMessengerPersistChannelIdentity()).toBeNull();
    expect(getMessengerPersistQueryEnabled()).toBe(true);
    hold.release();
    await pending;
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toBeNull();
    expect(getMessengerPersistQueryEnabled()).toBe(true);
    expect(tracked.reads).not.toContain(IDENTITY_B_INVALID);
  });

  it('rejects delayed A compare-write after switch and does not resurrect A', async () => {
    const hold = createHold();
    const inner = createMemoryMessengerPersistBackend(undefined, {
      afterRead: async () => hold.latch,
    });
    const tracked = trackBackend(inner);
    setMessengerPersistBackendForTests(tracked.backend);
    const queryClient = createClient();
    startSession(queryClient);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_A);
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
      persistTestInternalPage('from-A'),
    );
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('4'));
    const generationA = readMessengerPersistGeneration();
    const delayed = persistMessengerCacheNow(queryClient, IDENTITY_A, generationA, null);
    await Promise.resolve();
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_B_INVALID);
    hold.release();
    expect(await delayed).toBe(false);
    expect(await inner.read(IDENTITY_A)).toBeNull();
    expect(tracked.writes).not.toContain(IDENTITY_B_INVALID);
    expect(tracked.deletes).not.toContain(IDENTITY_B_INVALID);
  });

  it('ignores a channel A message after switch to invalid B', () => {
    const queryClient = createClient();
    startSession(queryClient);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_A);
    expect(ingestChannelMessage(IDENTITY_A, channelMessage(IDENTITY_A), NOW)).not.toBeNull();
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_B_INVALID);
    expect(ingestChannelMessage(IDENTITY_A, channelMessage(IDENTITY_A), NOW)).toBeNull();
    expect(readMessengerPersistLastSeenCapturedAt(IDENTITY_A)).toBe(0);
    expect(readMessengerPersistChannelIdentity()).toBeNull();
  });

  it('lets only C restore apply after rapid valid A → invalid B → valid C', () => {
    const queryClient = createClient();
    startSession(queryClient);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_A);
    const generationA = readMessengerPersistGeneration();
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_B_INVALID);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_C);
    expect(
      applyMessengerPersistEnvelope(queryClient, restoredEnvelope(IDENTITY_A, 'from-A'), Date.now(), generationA),
    ).toBe(false);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();
    const generationC = readMessengerPersistGeneration();
    expect(
      applyMessengerPersistEnvelope(queryClient, restoredEnvelope(IDENTITY_C, 'from-C'), Date.now(), generationC),
    ).toBe(true);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(persistTestInternalPage('from-C'));
    expect(readMessengerPersistChannelIdentity()).toBe(IDENTITY_C);
    expect(getMessengerPersistQueryEnabled()).toBe(false);
  });

  it('never uses invalid B as an IDB key', async () => {
    const inner = createMemoryMessengerPersistBackend({
      [IDENTITY_A]: serializedEnvelope(IDENTITY_A, 'from-A'),
    });
    const tracked = trackBackend(inner);
    setMessengerPersistBackendForTests(tracked.backend);
    const queryClient = createClient();
    startSession(queryClient);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_A);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_B_INVALID);
    await hydrateMessengerPersistCache(queryClient, IDENTITY_B_INVALID);
    expect(await persistMessengerCacheNow(queryClient, IDENTITY_B_INVALID, 1, null)).toBe(false);
    expect(tracked.reads).not.toContain(IDENTITY_B_INVALID);
    expect(tracked.writes).not.toContain(IDENTITY_B_INVALID);
    expect(tracked.deletes).not.toContain(IDENTITY_B_INVALID);
    expect(await inner.read(IDENTITY_B_INVALID)).toBeNull();
  });

  it('does not revoke or evict on same-identity loading', () => {
    const queryClient = createClient();
    startSession(queryClient);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_A);
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
      persistTestInternalPage('from-A'),
    );
    const generation = readMessengerPersistGeneration();
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_A);
    expect(readMessengerPersistGeneration()).toBe(generation);
    expect(readMessengerPersistGate(queryClient).identityId).toBe(IDENTITY_A);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(persistTestInternalPage('from-A'));
    expect(
      shouldWithholdMessengerPersistChildren({
        status: 'loading',
        liveIdentity: IDENTITY_A,
        preparedIdentityId: IDENTITY_A,
      }),
    ).toBe(false);
  });

  it('revokes A generation when persistence is disabled during A → B', async () => {
    const inner = createMemoryMessengerPersistBackend();
    const tracked = trackBackend(inner);
    setMessengerPersistBackendForTests(tracked.backend);
    const queryClient = createClient();
    startSession(queryClient);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_A);
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
      persistTestInternalPage('from-A'),
    );
    const generationA = readMessengerPersistGeneration();
    setMessengerPersistenceEnabledForTests(false);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_B_VALID);
    expect(isMessengerPersistGenerationCurrent(generationA)).toBe(false);
    expect(readMessengerPersistChannelIdentity()).toBeNull();
    expect(readMessengerPersistGate(queryClient).identityId).toBe(IDENTITY_B_VALID);
    expect(getMessengerPersistQueryEnabled()).toBe(true);
    expect(await persistMessengerCacheNow(queryClient, IDENTITY_A, generationA, null)).toBe(false);
    expect(
      await persistMessengerCacheNow(queryClient, IDENTITY_A, readMessengerPersistGeneration(), null),
    ).toBe(false);
    expect(tracked.reads).not.toContain(IDENTITY_B_VALID);
    expect(tracked.writes).not.toContain(IDENTITY_B_VALID);
  });
});
