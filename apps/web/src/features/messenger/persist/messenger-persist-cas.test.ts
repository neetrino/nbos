import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { createMemoryMessengerPersistBackend } from './messenger-persist-idb';
import { commitMessengerPersistCapture } from './messenger-persist-write';
import { captureMessengerPersistSnapshot } from './messenger-persist-snapshot';
import {
  beginMessengerPersistHydration,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';
import {
  persistMessengerCacheNow,
  setMessengerPersistBackendForTests,
} from './messenger-persist-controller';
import { parseMessengerPersistEnvelope } from './messenger-persist-envelope';
import { persistTestCollection } from './messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function captureNamed(name: string, capturedAt: number) {
  const queryClient = createClient();
  queryClient.setQueryData(
    messengerQueryKeys.collections('INTERNAL'),
    [persistTestCollection('col-1', name)],
    { updatedAt: capturedAt - 1 },
  );
  const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, capturedAt);
  if (!capture) throw new Error('expected capture');
  return capture;
}

describe('Messenger persist compare-and-write', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
    setMessengerPersistBackendForTests(null);
  });

  it('does not let a delayed older capture overwrite a newer concurrent write', async () => {
    let release: () => void = () => undefined;
    const latch = new Promise<void>((resolve) => {
      release = resolve;
    });
    let reads = 0;
    const backend = createMemoryMessengerPersistBackend(undefined, {
      afterRead: async () => {
        reads += 1;
        if (reads === 1) await latch;
      },
    });
    const queryClient = createClient();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    const older = captureNamed('Old', Date.now() - 5_000);
    const newer = captureNamed('New', Date.now() - 1_000);
    const delayed = commitMessengerPersistCapture(backend, older, IDENTITY, generation, null);
    await Promise.resolve();
    const wroteNewer = await commitMessengerPersistCapture(
      backend,
      newer,
      IDENTITY,
      generation,
      null,
    );
    expect(wroteNewer).toBe(true);
    release();
    expect(await delayed).toBe(false);
    const stored = parseMessengerPersistEnvelope(
      JSON.parse((await backend.read(IDENTITY)) ?? 'null'),
      IDENTITY,
      Date.now(),
    );
    expect(stored?.queries[0]?.data).toEqual([persistTestCollection('col-1', 'New')]);
  });

  it('treats a malformed existing row as absent and writes the candidate', async () => {
    const backend = createMemoryMessengerPersistBackend({ [IDENTITY]: '{not-json' });
    const queryClient = createClient();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    const now = Date.now();
    queryClient.setQueryData(
      messengerQueryKeys.collections('INTERNAL'),
      [persistTestCollection()],
      { updatedAt: now - 1 },
    );
    const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, now);
    expect(capture).not.toBeNull();
    if (!capture) return;
    expect(await commitMessengerPersistCapture(backend, capture, IDENTITY, generation, null)).toBe(
      true,
    );
    const stored = parseMessengerPersistEnvelope(
      JSON.parse((await backend.read(IDENTITY)) ?? 'null'),
      IDENTITY,
      Date.now(),
    );
    expect(stored?.identityId).toBe(IDENTITY);
  });

  it('treats compare-and-write failure as non-fatal', async () => {
    setMessengerPersistBackendForTests({
      read: async () => null,
      write: async () => undefined,
      compareAndWrite: async () => {
        throw new Error('quota');
      },
      delete: async () => undefined,
      clear: async () => undefined,
    });
    const queryClient = createClient();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    queryClient.setQueryData(messengerQueryKeys.collections('INTERNAL'), [persistTestCollection()]);
    await expect(persistMessengerCacheNow(queryClient, IDENTITY, generation, null)).resolves.toBe(
      false,
    );
  });
});
