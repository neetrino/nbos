import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerQueryKeys } from './messenger-query-keys';
import { messengerTestCheckpoint, messengerTestFullRecovery } from './messenger-test-checkpoint';
import { seedInternalMessengerBootstrap } from './seed-messenger-bootstrap';
import { recoverMessengerZone } from './messenger-delta-recovery';
import {
  writeMessengerHttpCheckpoint,
  readMessengerHttpCheckpoint,
  restoreMessengerHttpCheckpoint,
} from './messenger-checkpoint-store';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';

const KEEP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const GONE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NEW = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const OTHER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const FRESH = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const TEMP = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

const listDelta = vi.fn();
const bootstrapInternal = vi.fn();
const listClientDelta = vi.fn();

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: {
    listDelta: (...args: unknown[]) => listDelta(...args),
    bootstrap: (...args: unknown[]) => bootstrapInternal(...args),
  },
}));

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: {
    listDelta: (...args: unknown[]) => listClientDelta(...args),
    bootstrap: vi.fn(),
  },
}));

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function row(id: string, zone: 'INTERNAL' | 'CLIENT' = 'INTERNAL'): MessengerCoreConversationRow {
  return {
    id,
    zone,
    type: 'DIRECT',
    title: id,
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastMessageAt: '2026-09-01T00:00:00.000Z',
  };
}

function okPage(overrides: Record<string, unknown> = {}) {
  return {
    checkpoint: '9',
    authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
    resetRequired: false,
    summaries: [],
    removedConversationIds: [],
    changedConversationIds: [],
    hasMore: false,
    ...overrides,
  };
}

describe('Messenger delta reconnect recovery', () => {
  beforeEach(() => {
    listDelta.mockReset();
    bootstrapInternal.mockReset();
    listClientDelta.mockReset();
  });

  it('seeds checkpoint with bootstrap and drains every delta page before advancing', async () => {
    const queryClient = createClient();
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [row(KEEP), row(GONE)], mentionsAvailable: true },
      collections: [],
      ...messengerTestCheckpoint('4'),
    });
    listDelta
      .mockResolvedValueOnce(
        okPage({
          summaries: [row(KEEP), row(NEW)],
          changedConversationIds: [KEEP],
          hasMore: true,
          nextCursor: `9|5|${KEEP}`,
        }),
      )
      .mockResolvedValueOnce(
        okPage({
          removedConversationIds: [GONE],
          changedConversationIds: [GONE],
        }),
      );
    queryClient.setQueryData(messengerQueryKeys.messages(KEEP), {
      items: [],
      meta: { hasMoreOlder: false },
    });
    queryClient.setQueryData(messengerQueryKeys.messages(OTHER), {
      items: [],
      meta: { hasMoreOlder: false },
    });
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(listDelta).toHaveBeenCalledTimes(2);
    expect(listClientDelta).not.toHaveBeenCalled();
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')?.checkpoint).toBe('9');
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
    );
    expect(cached?.items.map((item) => item.id).sort()).toEqual([KEEP, NEW].sort());
    expect(cached?.items.some((item) => item.id === GONE)).toBe(false);
    expect(
      queryClient.getQueryCache().find({ queryKey: messengerQueryKeys.messages(KEEP), exact: true })
        ?.state.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryCache().find({ queryKey: messengerQueryKeys.messages(OTHER), exact: true })
        ?.state.isInvalidated,
    ).toBeFalsy();
  });

  it('dedupes duplicate reconnect recovery onto one in-flight drain', async () => {
    const queryClient = createClient();
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('1'));
    let resolveDelta: (value: unknown) => void = () => undefined;
    listDelta.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelta = resolve;
        }),
    );
    const first = recoverMessengerZone(queryClient, 'INTERNAL');
    const second = recoverMessengerZone(queryClient, 'INTERNAL');
    resolveDelta(okPage({ checkpoint: '1' }));
    await Promise.all([first, second]);
    expect(listDelta).toHaveBeenCalledTimes(1);
  });

  it('does not advance the checkpoint when a later page fails', async () => {
    const queryClient = createClient();
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [row(KEEP)], mentionsAvailable: true },
      collections: [],
      ...messengerTestCheckpoint('3'),
    });
    bootstrapInternal.mockResolvedValue({
      summaries: { items: [row(KEEP)], mentionsAvailable: true },
      collections: [],
      ...messengerTestCheckpoint('3'),
    });
    listDelta
      .mockResolvedValueOnce(
        okPage({
          checkpoint: '8',
          summaries: [row(TEMP)],
          hasMore: true,
          nextCursor: `8|4|${KEEP}`,
        }),
      )
      .mockRejectedValueOnce(new Error('network'));
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')?.checkpoint).toBe('3');
  });

  it('falls back to bootstrap when no checkpoint exists without a second list fetch', async () => {
    const queryClient = createClient();
    bootstrapInternal.mockResolvedValue({
      summaries: { items: [row(FRESH)], mentionsAvailable: true },
      collections: [],
      ...messengerTestFullRecovery(),
    });
    await recoverMessengerZone(queryClient, 'INTERNAL', {
      activeId: FRESH,
      clearActive: () => undefined,
    });
    expect(listDelta).not.toHaveBeenCalled();
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toBeNull();
  });

  it('clears a stale checkpoint on FULL fallback and does not invalidate seeded summaries', async () => {
    const queryClient = createClient();
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('9'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    bootstrapInternal.mockResolvedValue({
      summaries: { items: [row(FRESH)], mentionsAvailable: true },
      collections: [],
      ...messengerTestFullRecovery(),
    });
    listDelta.mockResolvedValue(okPage({ checkpoint: '2', resetRequired: true }));
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toBeNull();
    expect(queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }))).toEqual({
      items: [row(FRESH)],
      mentionsAvailable: true,
    });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('falls back to FULL bootstrap on a regressing checkpoint or cross-zone summary', async () => {
    const queryClient = createClient();
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('8'));
    bootstrapInternal.mockResolvedValue({
      summaries: { items: [row(FRESH)], mentionsAvailable: true },
      collections: [],
      ...messengerTestFullRecovery(),
    });
    listDelta.mockResolvedValueOnce(okPage({ checkpoint: '3', summaries: [row(KEEP)] }));
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
    listDelta.mockReset();
    bootstrapInternal.mockClear();
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('4'));
    listDelta.mockResolvedValueOnce(okPage({ summaries: [row(KEEP, 'CLIENT')] }));
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
  });

  it('falls back when a removal id is malformed or a cursor repeats', async () => {
    const queryClient = createClient();
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('4'));
    bootstrapInternal.mockResolvedValue({
      summaries: { items: [row(FRESH)], mentionsAvailable: true },
      collections: [],
      ...messengerTestFullRecovery(),
    });
    listDelta.mockResolvedValueOnce(okPage({ removedConversationIds: ['not-a-uuid'] }));
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('4'));
    bootstrapInternal.mockClear();
    listDelta
      .mockResolvedValueOnce(okPage({ hasMore: true, nextCursor: `9|5|${KEEP}` }))
      .mockResolvedValueOnce(okPage({ hasMore: true, nextCursor: `9|5|${KEEP}` }));
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
  });

  it('runs restored checkpoints through delta guards and falls back on auth failure', async () => {
    const queryClient = createClient();
    restoreMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('4'));
    listDelta.mockRejectedValueOnce(new Error('authorization epoch mismatch'));
    bootstrapInternal.mockResolvedValue({
      summaries: { items: [row(FRESH)], mentionsAvailable: true },
      collections: [],
      ...messengerTestFullRecovery(),
    });
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(listDelta).toHaveBeenCalledTimes(1);
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toBeNull();
  });
});
