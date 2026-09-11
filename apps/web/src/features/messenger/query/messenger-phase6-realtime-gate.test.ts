import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { applyMessengerRealtimeMessage, applyMessengerSendResult } from './messenger-cache';
import { messengerQueryKeys } from './messenger-query-keys';
import {
  applyMessengerAccessChanged,
  applyMessengerRealtimeRead,
  applyMessengerRealtimeSummary,
} from './messenger-realtime-cache';
import {
  bindMessengerRealtimeSocket,
  type MessengerRealtimeSocket,
} from '@/features/messenger-internal/messenger-realtime-bind';
import { recoverMessengerZone } from './messenger-delta-recovery';
import { seedInternalMessengerBootstrap } from './seed-messenger-bootstrap';
import { messengerTestCheckpoint } from './messenger-test-checkpoint';

const KEEP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const listDelta = vi.fn();
const bootstrapInternal = vi.fn();

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: {
    listDelta: (...args: unknown[]) => listDelta(...args),
    bootstrap: (...args: unknown[]) => bootstrapInternal(...args),
  },
}));

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: { listDelta: vi.fn(), bootstrap: vi.fn() },
}));

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function summary(id: string): MessengerCoreConversationRow {
  return {
    id,
    zone: 'INTERNAL',
    type: 'DIRECT',
    title: id,
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastMessageAt: '2026-09-01T00:00:00.000Z',
    lastMessagePreview: 'old',
    unreadCount: 1,
  };
}

function message(id: string, conversationId: string, status?: string): MessengerCoreMessageRow {
  return {
    id,
    conversationId,
    senderId: 'e1',
    senderName: 'Ada',
    content: 'hello',
    createdAt: '2026-09-05T12:00:00.000Z',
    editedAt: null,
    attachments: [],
    ...(status ? { status: status as MessengerCoreMessageRow['status'] } : {}),
  };
}

function seedInbox(queryClient: QueryClient) {
  const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
  queryClient.setQueryData(key, { items: [summary('c1'), summary('c2')] });
  queryClient.setQueryData(messengerQueryKeys.messages('c1'), {
    items: [message('m1', 'c1', 'QUEUED')],
    meta: { hasMoreOlder: false },
  });
  return key;
}

function expectListNotInvalidated(queryClient: QueryClient, key: readonly unknown[]) {
  expect(
    queryClient.getQueryCache().find({ queryKey: key, exact: true })?.state.isInvalidated,
  ).toBe(false);
}

describe('Phase 6 realtime final gate', () => {
  it('message/summary/read/delivery reducers do not invalidate the inbox list', () => {
    const queryClient = createClient();
    const key = seedInbox(queryClient);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    applyMessengerRealtimeMessage(queryClient, message('m1', 'c1', 'SENT'));
    applyMessengerRealtimeMessage(queryClient, message('m1', 'c1', 'DELIVERED'));
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', {
      conversationId: 'c1',
      zone: 'INTERNAL',
      lastMessageAt: '2026-09-05T13:00:00.000Z',
      lastMessagePreview: 'hello',
      unreadCount: 2,
      lastReadAt: null,
    });
    applyMessengerRealtimeRead(queryClient, 'INTERNAL', {
      scope: 'conversation',
      conversationId: 'c1',
      unreadCount: 0,
      zone: 'INTERNAL',
      lastReadAt: '2026-09-05T13:00:00.000Z',
    });
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', {
      conversationId: 'c1',
      zone: 'INTERNAL',
      lastMessageAt: '2026-09-05T12:00:00.000Z',
      lastMessagePreview: 'stale',
      unreadCount: 9,
      lastReadAt: null,
    });
    expectListNotInvalidated(queryClient, key);
    expect(invalidate).not.toHaveBeenCalled();
    const items = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key)?.items;
    expect(items?.[0]?.lastMessagePreview).toBe('hello');
    expect(items?.[0]?.unreadCount).toBe(0);
    expect(
      queryClient.getQueryData<{ items: MessengerCoreMessageRow[] }>(
        messengerQueryKeys.messages('c1'),
      )?.items[0]?.status,
    ).toBe('DELIVERED');
  });

  it('access revocation purges the thread without a full-list refetch', () => {
    const queryClient = createClient();
    const key = seedInbox(queryClient);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    applyMessengerAccessChanged(queryClient, 'INTERNAL', 'c1', 'INTERNAL');
    expect(
      queryClient
        .getQueryData<{ items: MessengerCoreConversationRow[] }>(key)
        ?.items.map((row) => row.id),
    ).toEqual(['c2']);
    expect(queryClient.getQueryData(messengerQueryKeys.messages('c1'))).toBeUndefined();
    expectListNotInvalidated(queryClient, key);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('reconnect delta invalidates only changed thread histories', async () => {
    const queryClient = createClient();
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [summary(KEEP), summary(OTHER)], mentionsAvailable: true },
      collections: [],
      ...messengerTestCheckpoint('4'),
    });
    queryClient.setQueryData(messengerQueryKeys.messages(KEEP), {
      items: [],
      meta: { hasMoreOlder: false },
    });
    queryClient.setQueryData(messengerQueryKeys.messages(OTHER), {
      items: [],
      meta: { hasMoreOlder: false },
    });
    listDelta.mockResolvedValue({
      checkpoint: '9',
      authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
      resetRequired: false,
      summaries: [summary(KEEP)],
      removedConversationIds: [],
      changedConversationIds: [KEEP],
      hasMore: false,
    });
    await recoverMessengerZone(queryClient, 'INTERNAL');
    expect(listDelta).toHaveBeenCalledTimes(1);
    expect(bootstrapInternal).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryCache().find({ queryKey: messengerQueryKeys.messages(KEEP), exact: true })
        ?.state.isInvalidated,
    ).toBe(true);
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: messengerQueryKeys.messages(OTHER), exact: true })?.state.isInvalidated,
    ).toBeFalsy();
  });

  it('closes the socket so Strict Mode remount cannot leak listeners', () => {
    const socket = {
      on: vi.fn(),
      emit: vi.fn(),
      close: vi.fn(),
    } as unknown as MessengerRealtimeSocket & { close: ReturnType<typeof vi.fn> };
    const first = bindMessengerRealtimeSocket(socket, {
      conversationIdRef: { current: 'c1' },
      onInboundRef: { current: vi.fn() },
      onSummaryRef: { current: undefined },
      onConversationReadRef: { current: undefined },
      onAccessChangedRef: { current: undefined },
      onReadRef: { current: undefined },
      onReconnectRef: { current: undefined },
    });
    first();
    expect(socket.close).toHaveBeenCalledTimes(1);
    const second = bindMessengerRealtimeSocket(socket, {
      conversationIdRef: { current: 'c1' },
      onInboundRef: { current: vi.fn() },
      onSummaryRef: { current: undefined },
      onConversationReadRef: { current: undefined },
      onAccessChangedRef: { current: undefined },
      onReadRef: { current: undefined },
      onReconnectRef: { current: undefined },
    });
    second();
    expect(socket.close).toHaveBeenCalledTimes(2);
  });

  it('send+duplicate realtime does not create a second list refetch path', () => {
    const queryClient = createClient();
    const key = seedInbox(queryClient);
    applyMessengerSendResult(queryClient, 'INTERNAL', message('m2', 'c1', 'QUEUED'));
    applyMessengerRealtimeMessage(queryClient, message('m2', 'c1', 'SENT'));
    expectListNotInvalidated(queryClient, key);
    expect(
      queryClient
        .getQueryData<{ items: MessengerCoreMessageRow[] }>(messengerQueryKeys.messages('c1'))
        ?.items.filter((row) => row.id === 'm2'),
    ).toHaveLength(1);
  });
});
