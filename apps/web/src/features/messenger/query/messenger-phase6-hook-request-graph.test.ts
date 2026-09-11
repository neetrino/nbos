/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyMessengerPersistEnvelope } from '@/features/messenger/persist/messenger-persist-hydrate';
import {
  beginMessengerPersistHydration,
  resetMessengerPersistSessionForTests,
  settleMessengerPersistHydration,
} from '@/features/messenger/persist/messenger-persist-session';
import {
  resetMessengerPersistReadyForTests,
  settleMessengerPersistReadyForTests,
} from '@/features/messenger/persist/messenger-persist-ready';
import { MESSENGER_CACHE_SCHEMA_VERSION } from '@/features/messenger/persist/messenger-persist.constants';
import {
  persistTestClientPage,
  persistTestCollection,
  persistTestInternalPage,
} from '@/features/messenger/persist/messenger-persist-test-dto';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { messengerTestCheckpoint } from '@/features/messenger/query/messenger-test-checkpoint';
import { MESSENGER_QUERY_STALE_TIME_MS } from '@/features/messenger/query/messenger-query-policy';
import {
  createMessengerTestQueryClient,
  flushUntil,
  mountClientMessengerQueries,
  mountInternalMessengerQueries,
  unmountHookTree,
  type HookRequestFrame,
} from '@/features/messenger/query/messenger-phase6-hook-harness';

const bootstrapInternal = vi.fn();
const bootstrapClient = vi.fn();
const listInternalConversations = vi.fn();
const listInternalCollections = vi.fn();
const listClientConversations = vi.fn();
const listClientCollections = vi.fn();
const forbidden = vi.fn(async (_id: string) => {
  throw new Error('unexpected Messenger GET');
});

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: {
    bootstrap: () => bootstrapInternal(),
    listConversations: () => listInternalConversations(),
    listCollections: () => listInternalCollections(),
    getCollection: (id: string) => forbidden(id),
    listMessages: (id: string) => forbidden(id),
  },
}));

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: {
    bootstrap: () => bootstrapClient(),
    listConversations: () => listClientConversations(),
    listCollections: () => listClientCollections(),
    getCollection: (id: string) => forbidden(id),
    listMessages: (id: string) => forbidden(id),
  },
}));

const IDENTITY = 'employee-user-aaaa';
const INTERNAL = {
  bootstrap: 'POST /messenger/core/internal/bootstrap',
  conversations: 'GET /messenger/core/internal/conversations',
  collections: 'GET /messenger/core/internal/collections',
} as const;
const CLIENT = {
  bootstrap: 'POST /messenger/core/client/bootstrap',
  conversations: 'GET /messenger/core/client/conversations',
  collections: 'GET /messenger/core/client/collections',
} as const;

describe('Phase 6 Messenger hook request graph', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    resetMocks();
    resetMessengerPersistSessionForTests();
    resetMessengerPersistReadyForTests();
  });

  afterEach(() => {
    resetMessengerPersistSessionForTests();
    resetMessengerPersistReadyForTests();
  });

  it('cold Internal default issues one bootstrap and no list/collection GETs', async () => {
    const requests = trackInternal();
    settleMessengerPersistReadyForTests(IDENTITY);
    const frames: HookRequestFrame[] = [];
    const mounted = await mountInternalMessengerQueries(createMessengerTestQueryClient(), frames);
    await flushUntil(() => frames.at(-1)?.itemIds[0] === 'live-i' && requests.length > 0);
    expect(requests).toEqual([INTERNAL.bootstrap]);
    expect(frames.at(-1)).toMatchObject({
      itemIds: ['live-i'],
      listPending: false,
      listError: null,
    });
    await unmountHookTree(mounted);
  });

  it('cold Client default issues one zone bootstrap and no fallback GETs', async () => {
    const requests = trackClient();
    settleMessengerPersistReadyForTests(IDENTITY);
    const frames: HookRequestFrame[] = [];
    const mounted = await mountClientMessengerQueries(createMessengerTestQueryClient(), frames);
    await flushUntil(() => frames.at(-1)?.itemIds[0] === 'live-c' && requests.length > 0);
    expect(requests).toEqual([CLIENT.bootstrap]);
    expect(frames.at(-1)).toMatchObject({
      itemIds: ['live-c'],
      listPending: false,
      listError: null,
    });
    await unmountHookTree(mounted);
  });

  it('StrictMode remount keeps one logical bootstrap per zone', async () => {
    const internal = trackInternal();
    const client = trackClient();
    settleMessengerPersistReadyForTests(IDENTITY);
    const internalFrames: HookRequestFrame[] = [];
    const clientFrames: HookRequestFrame[] = [];
    const a = await mountInternalMessengerQueries(
      createMessengerTestQueryClient(),
      internalFrames,
      {
        strict: true,
      },
    );
    const b = await mountClientMessengerQueries(createMessengerTestQueryClient(), clientFrames, {
      strict: true,
    });
    await flushUntil(() => internalFrames.at(-1)?.itemIds[0] === 'live-i');
    await flushUntil(() => clientFrames.at(-1)?.itemIds[0] === 'live-c');
    expect(internal).toEqual([INTERNAL.bootstrap]);
    expect(client).toEqual([CLIENT.bootstrap]);
    await unmountHookTree(a);
    await unmountHookTree(b);
  });

  it('bootstrap failure enables fallback list and collection GETs without blanking after they settle', async () => {
    const requests = trackInternal();
    bootstrapInternal.mockImplementation(async () => {
      requests.push(INTERNAL.bootstrap);
      throw new Error('bootstrap down');
    });
    settleMessengerPersistReadyForTests(IDENTITY);
    const frames: HookRequestFrame[] = [];
    const mounted = await mountInternalMessengerQueries(createMessengerTestQueryClient(), frames);
    await flushUntil(() => frames.at(-1)?.itemIds[0] === 'fallback-i');
    expect(countOf(requests, INTERNAL.bootstrap)).toBe(1);
    expect(countOf(requests, INTERNAL.conversations)).toBe(1);
    expect(countOf(requests, INTERNAL.collections)).toBe(1);
    // Fallback GETs write default cache after failedAt and clear the latch.
    expect(frames.at(-1)).toMatchObject({
      itemIds: ['fallback-i'],
      listPending: false,
      listError: null,
    });
    await unmountHookTree(mounted);
  });

  it('stale restored canonical list paints immediately and recovers with one bootstrap', async () => {
    const requests = trackInternal();
    const queryClient = createMessengerTestQueryClient();
    restoreStaleInternal(queryClient);
    const frames: HookRequestFrame[] = [];
    const mounted = await mountInternalMessengerQueries(queryClient, frames);
    expect(frames[0]).toMatchObject({ itemIds: ['restored-i'], listPending: false });
    await flushUntil(() => frames.at(-1)?.itemIds[0] === 'live-i');
    expect(requests).toEqual([INTERNAL.bootstrap]);
    expect(frames.every((frame) => frame.listPending === false)).toBe(true);
    expect(frames.at(-1)).toMatchObject({ itemIds: ['live-i'], listError: null });
    await unmountHookTree(mounted);
  });
});

function resetMocks(): void {
  bootstrapInternal.mockReset();
  bootstrapClient.mockReset();
  listInternalConversations.mockReset();
  listInternalCollections.mockReset();
  listClientConversations.mockReset();
  listClientCollections.mockReset();
  forbidden.mockClear();
}

function trackInternal(): string[] {
  const requests: string[] = [];
  bootstrapInternal.mockImplementation(async () => {
    requests.push(INTERNAL.bootstrap);
    return {
      summaries: persistTestInternalPage('live-i'),
      collections: [persistTestCollection()],
      ...messengerTestCheckpoint(),
    };
  });
  listInternalConversations.mockImplementation(async () => {
    requests.push(INTERNAL.conversations);
    return persistTestInternalPage('fallback-i');
  });
  listInternalCollections.mockImplementation(async () => {
    requests.push(INTERNAL.collections);
    return [persistTestCollection()];
  });
  return requests;
}

function trackClient(): string[] {
  const requests: string[] = [];
  bootstrapClient.mockImplementation(async () => {
    requests.push(CLIENT.bootstrap);
    return {
      summaries: persistTestClientPage('live-c'),
      collections: [{ ...persistTestCollection(), zone: 'CLIENT' as const }],
      ...messengerTestCheckpoint(),
    };
  });
  listClientConversations.mockImplementation(async () => {
    requests.push(CLIENT.conversations);
    return persistTestClientPage('fallback-c');
  });
  listClientCollections.mockImplementation(async () => {
    requests.push(CLIENT.collections);
    return [{ ...persistTestCollection(), zone: 'CLIENT' as const }];
  });
  return requests;
}

function restoreStaleInternal(
  queryClient: ReturnType<typeof createMessengerTestQueryClient>,
): void {
  const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
  const capturedAt = Date.now() - MESSENGER_QUERY_STALE_TIME_MS - 1_000;
  applyMessengerPersistEnvelope(
    queryClient,
    {
      schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
      identityId: IDENTITY,
      capturedAt,
      writtenAt: capturedAt,
      queries: [
        {
          queryKey: [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
          dataUpdatedAt: capturedAt,
          data: persistTestInternalPage('restored-i'),
        },
        {
          queryKey: [...messengerQueryKeys.collections('INTERNAL')],
          dataUpdatedAt: capturedAt,
          data: [persistTestCollection()],
        },
      ],
      checkpoints: {},
    },
    Date.now(),
    generation,
  );
  settleMessengerPersistHydration(queryClient, generation);
}

function countOf(requests: string[], endpoint: string): number {
  return requests.filter((item) => item === endpoint).length;
}
