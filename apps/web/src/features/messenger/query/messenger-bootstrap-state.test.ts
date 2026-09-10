import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerQueryKeys } from './messenger-query-keys';
import { MESSENGER_QUERY_STALE_TIME_MS } from './messenger-query-policy';
import {
  acknowledgeMessengerBootstrapLatch,
  messengerCollectionsEnabled,
  messengerDefaultQueriesEnabled,
  readMessengerBootstrapState,
  shouldRetryMessengerBootstrap,
} from './messenger-bootstrap-state';
import { seedInternalMessengerBootstrap } from './seed-messenger-bootstrap';
import { messengerTestCheckpoint } from './messenger-test-checkpoint';
import { ensureMessengerBootstrap, runMessengerBootstrap } from './use-messenger-bootstrap';

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

function seedDefaults(queryClient: QueryClient) {
  seedInternalMessengerBootstrap(queryClient, {
    summaries: { items: [{ id: 'cached' } as never], mentionsAvailable: true },
    collections: [{ id: 'col-cached', name: 'Favorites' } as never],
    ...messengerTestCheckpoint(),
  });
}

function ageDefaultCache(queryClient: QueryClient): void {
  const stamped = Date.now() - MESSENGER_QUERY_STALE_TIME_MS - 1;
  for (const query of queryClient.getQueryCache().getAll()) {
    query.setState({ dataUpdatedAt: stamped });
  }
}

function assertHookGating(
  state: ReturnType<typeof readMessengerBootstrapState>,
  expected: { collections: boolean; defaultSummaries: boolean; search: boolean },
) {
  expect(messengerCollectionsEnabled(true, state)).toBe(expected.collections);
  expect(messengerDefaultQueriesEnabled(true, state, true)).toBe(expected.defaultSummaries);
  expect(messengerDefaultQueriesEnabled(true, state, false)).toBe(expected.search);
}

describe('Messenger bootstrap query-hook gating', () => {
  beforeEach(() => {
    bootstrapInternal.mockReset();
  });

  it('keeps first entry pending until bootstrap finishes', () => {
    const queryClient = createClient();
    const state = readMessengerBootstrapState(queryClient, 'INTERNAL', true);
    expect(state).toMatchObject({ error: null, settled: false, isPending: true });
    assertHookGating(state, { collections: false, defaultSummaries: false, search: true });
  });

  it('renders stale cache while disabling standalone default queries', () => {
    const queryClient = createClient();
    seedDefaults(queryClient);
    ageDefaultCache(queryClient);
    const state = readMessengerBootstrapState(queryClient, 'INTERNAL', true);
    expect(queryClient.getQueryData(messengerQueryKeys.collections('INTERNAL'))).toBeTruthy();
    expect(state).toMatchObject({ error: null, settled: false, isPending: true, fresh: false });
    assertHookGating(state, { collections: false, defaultSummaries: false, search: true });
  });

  it('exposes bootstrap failure against stale data and enables fallbacks', async () => {
    const queryClient = createClient();
    seedDefaults(queryClient);
    ageDefaultCache(queryClient);
    bootstrapInternal.mockRejectedValueOnce(new Error('bootstrap down'));
    await expect(runMessengerBootstrap(queryClient, 'INTERNAL')).rejects.toThrow('bootstrap down');
    const state = readMessengerBootstrapState(queryClient, 'INTERNAL', true);
    expect(state.error?.message).toBe('bootstrap down');
    expect(state.settled).toBe(true);
    expect(state.isPending).toBe(false);
    assertHookGating(state, { collections: true, defaultSummaries: true, search: true });
    expect(queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }))).toEqual(
      { items: [{ id: 'cached' }], mentionsAvailable: true },
    );
  });

  it('keeps the error after only one fallback key refreshes', async () => {
    const queryClient = createClient();
    seedDefaults(queryClient);
    ageDefaultCache(queryClient);
    bootstrapInternal.mockRejectedValueOnce(new Error('bootstrap down'));
    await expect(runMessengerBootstrap(queryClient, 'INTERNAL')).rejects.toThrow('bootstrap down');
    queryClient.setQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
      items: [{ id: 'partial' }],
      mentionsAvailable: true,
    });
    const state = readMessengerBootstrapState(queryClient, 'INTERNAL', true);
    expect(state.error?.message).toBe('bootstrap down');
    expect(state.settled).toBe(true);
    assertHookGating(state, { collections: true, defaultSummaries: true, search: true });
  });

  it('clears the latch only after both fallback keys update, then retries once when stale', async () => {
    const queryClient = createClient();
    seedDefaults(queryClient);
    ageDefaultCache(queryClient);
    bootstrapInternal.mockRejectedValueOnce(new Error('bootstrap down'));
    await expect(runMessengerBootstrap(queryClient, 'INTERNAL')).rejects.toThrow('bootstrap down');
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [{ id: 'fallback' } as never], mentionsAvailable: true },
      collections: [{ id: 'col-fallback', name: 'Favorites' } as never],
      ...messengerTestCheckpoint('1'),
    });
    const recovered = readMessengerBootstrapState(queryClient, 'INTERNAL', true);
    expect(recovered.error).toBeNull();
    expect(recovered.settled).toBe(true);
    assertHookGating(recovered, { collections: true, defaultSummaries: true, search: true });
    acknowledgeMessengerBootstrapLatch(queryClient, 'INTERNAL');
    ageDefaultCache(queryClient);
    const stale = readMessengerBootstrapState(queryClient, 'INTERNAL', true);
    expect(stale).toMatchObject({ error: null, settled: false, isPending: true });
    assertHookGating(stale, { collections: false, defaultSummaries: false, search: true });
    expect(shouldRetryMessengerBootstrap(queryClient, 'INTERNAL')).toBe(true);
    bootstrapInternal.mockResolvedValueOnce({
      summaries: { items: [] },
      collections: [],
      ...messengerTestCheckpoint('2'),
    });
    await ensureMessengerBootstrap(queryClient, 'INTERNAL');
    expect(bootstrapInternal).toHaveBeenCalledTimes(2);
    expect(readMessengerBootstrapState(queryClient, 'INTERNAL', true).error).toBeNull();
  });

  it('gates Internal and Client query hooks through the shared helpers', () => {
    const webSrc = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
    const internal = readFileSync(
      path.join(webSrc, 'features/messenger-internal/use-internal-messenger-queries.ts'),
      'utf8',
    );
    const client = readFileSync(
      path.join(webSrc, 'features/messenger-client/use-client-messenger-queries.ts'),
      'utf8',
    );
    for (const source of [internal, client]) {
      expect(source).toMatch(/messengerCollectionsEnabled\(/);
      expect(source).toMatch(/messengerDefaultQueriesEnabled\(/);
      expect(source).toMatch(/bootstrap\.error/);
      expect(source).toMatch(/bootstrap\.isPending/);
    }
  });
});
