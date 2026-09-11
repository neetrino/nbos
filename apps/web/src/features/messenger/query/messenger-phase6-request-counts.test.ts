import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deriveInternalVisibleSummaries,
  internalSummariesQueryKey,
  showMessengerListPlaceholder,
  usesSharedInternalAllDataset,
} from '@/features/messenger/query/derive-internal-summaries';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import {
  isMessengerDefaultCacheFresh,
  seedInternalMessengerBootstrap,
} from '@/features/messenger/query/seed-messenger-bootstrap';
import { messengerTestCheckpoint } from '@/features/messenger/query/messenger-test-checkpoint';
import {
  messengerDefaultQueriesEnabled,
  readMessengerBootstrapState,
} from '@/features/messenger/query/messenger-bootstrap-state';
import {
  ensureMessengerBootstrap,
  runMessengerBootstrap,
} from '@/features/messenger/query/use-messenger-bootstrap';
import { applyMessengerPersistEnvelope } from '@/features/messenger/persist/messenger-persist-hydrate';
import {
  beginMessengerPersistHydration,
  resetMessengerPersistSessionForTests,
} from '@/features/messenger/persist/messenger-persist-session';
import { MESSENGER_CACHE_SCHEMA_VERSION } from '@/features/messenger/persist/messenger-persist.constants';
import {
  persistTestInternalPage,
  persistTestInternalRow,
} from '@/features/messenger/persist/messenger-persist-test-dto';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';

const bootstrapInternal = vi.fn();
const bootstrapClient = vi.fn();
const listConversations = vi.fn();
const listCollections = vi.fn();
const listDelta = vi.fn();

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: {
    bootstrap: (...args: unknown[]) => bootstrapInternal(...args),
    listConversations: (...args: unknown[]) => listConversations(...args),
    listCollections: (...args: unknown[]) => listCollections(...args),
    listDelta: (...args: unknown[]) => listDelta(...args),
  },
}));

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: {
    bootstrap: (...args: unknown[]) => bootstrapClient(...args),
  },
}));

const IDENTITY = 'employee-user-aaaa';
const ENDPOINT = {
  internalBootstrap: 'POST /messenger/core/internal/bootstrap',
  internalConversations: 'GET /messenger/core/internal/conversations',
  internalCollections: 'GET /messenger/core/internal/collections',
  internalDelta: 'GET /messenger/core/internal/delta',
} as const;

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function trackInternalRequests(): string[] {
  const requests: string[] = [];
  bootstrapInternal.mockImplementation(async () => {
    requests.push(ENDPOINT.internalBootstrap);
    return {
      summaries: persistTestInternalPage('c1'),
      collections: [],
      ...messengerTestCheckpoint(),
    };
  });
  listConversations.mockImplementation(async () => {
    requests.push(ENDPOINT.internalConversations);
    return persistTestInternalPage('c1');
  });
  listCollections.mockImplementation(async () => {
    requests.push(ENDPOINT.internalCollections);
    return [];
  });
  listDelta.mockImplementation(async () => {
    requests.push(ENDPOINT.internalDelta);
    return { checkpoint: '1', summaries: [], hasMore: false };
  });
  return requests;
}

describe('Phase 6 Messenger client request counts (unit helpers)', () => {
  beforeEach(() => {
    bootstrapInternal.mockReset();
    bootstrapClient.mockReset();
    listConversations.mockReset();
    listCollections.mockReset();
    listDelta.mockReset();
    resetMessengerPersistSessionForTests();
  });

  it('cold Internal start issues one zone bootstrap and no list/collection GETs', async () => {
    const requests = trackInternalRequests();
    await runMessengerBootstrap(createClient(), 'INTERNAL');
    expect(requests).toEqual([ENDPOINT.internalBootstrap]);
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
  });

  it('dedupes Strict Mode double-mount onto one logical bootstrap', async () => {
    const requests = trackInternalRequests();
    const queryClient = createClient();
    await Promise.all([
      ensureMessengerBootstrap(queryClient, 'INTERNAL'),
      ensureMessengerBootstrap(queryClient, 'INTERNAL'),
    ]);
    expect(requests).toEqual([ENDPOINT.internalBootstrap]);
  });

  it('All↔Tasks after canonical cache uses zero network calls and does not blank', () => {
    const requests = trackInternalRequests();
    const queryClient = createClient();
    const summaries = {
      items: [
        persistTestInternalRow('c1'),
        { ...persistTestInternalRow('t1'), type: 'TASK' as const, title: 'Task' },
      ],
      mentionsAvailable: true,
    };
    seedInternalMessengerBootstrap(queryClient, {
      summaries,
      collections: [],
      ...messengerTestCheckpoint(),
    });
    expect(usesSharedInternalAllDataset('all', '', 'all')).toBe(true);
    expect(usesSharedInternalAllDataset('tasks', '', 'all')).toBe(true);
    expect(internalSummariesQueryKey('all', '', 'all')).toEqual(
      internalSummariesQueryKey('tasks', '', 'all'),
    );
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
    );
    const tasks = deriveInternalVisibleSummaries(cached?.items ?? [], 'tasks', 'all');
    expect(tasks.map((row) => row.id)).toEqual(['t1']);
    expect(showMessengerListPlaceholder(cached, false)).toBe(false);
    expect(requests).toEqual([]);
    expect(listConversations).not.toHaveBeenCalled();
    expect(listCollections).not.toHaveBeenCalled();
    expect(bootstrapInternal).not.toHaveBeenCalled();
  });

  it('same-session return renders fresh cache without a blocking bootstrap', () => {
    const queryClient = createClient();
    seedInternalMessengerBootstrap(queryClient, {
      summaries: persistTestInternalPage('cached'),
      collections: [],
      ...messengerTestCheckpoint(),
    });
    expect(isMessengerDefaultCacheFresh(queryClient, 'INTERNAL')).toBe(true);
    const state = readMessengerBootstrapState(queryClient, 'INTERNAL', true);
    expect(state).toMatchObject({ fresh: true, settled: true, isPending: false, error: null });
    expect(messengerDefaultQueriesEnabled(true, state, true)).toBe(true);
    expect(
      showMessengerListPlaceholder(
        queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
        state.isPending,
      ),
    ).toBe(false);
  });

  it('restored reload renders persisted list before background bootstrap', async () => {
    const requests = trackInternalRequests();
    const queryClient = createClient();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    const capturedAt = Date.now() - 1_000;
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
            dataUpdatedAt: Date.now() - 60_000,
            data: persistTestInternalPage('restored'),
          },
        ],
        checkpoints: {},
      },
      Date.now(),
      generation,
    );
    const restored = queryClient.getQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
    );
    expect(restored).toEqual(persistTestInternalPage('restored'));
    expect(showMessengerListPlaceholder(restored, true)).toBe(false);
    let resolveBootstrap: (value: unknown) => void = () => undefined;
    bootstrapInternal.mockImplementation(
      () =>
        new Promise((resolve) => {
          requests.push(ENDPOINT.internalBootstrap);
          resolveBootstrap = resolve;
        }),
    );
    const pending = runMessengerBootstrap(queryClient, 'INTERNAL');
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(persistTestInternalPage('restored'));
    resolveBootstrap({
      summaries: persistTestInternalPage('live'),
      collections: [],
      ...messengerTestCheckpoint('2'),
    });
    await pending;
    expect(requests).toEqual([ENDPOINT.internalBootstrap]);
    expect(listConversations).not.toHaveBeenCalled();
  });
});
