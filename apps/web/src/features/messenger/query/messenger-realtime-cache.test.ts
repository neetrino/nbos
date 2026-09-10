import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type {
  MessengerWsConversationReadUpdatedPayload,
  MessengerWsConversationSummaryPayload,
} from '@nbos/shared';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { applyMessengerRealtimeMessage } from './messenger-cache';
import { messengerQueryKeys } from './messenger-query-keys';
import {
  applyMessengerAccessChanged,
  applyMessengerRealtimeRead,
  applyMessengerRealtimeSummary,
  recoverMessengerRealtimeQueries,
} from './messenger-realtime-cache';
import { getReadWatermark } from './messenger-realtime-watermarks';
import {
  applyClientActiveId,
  createClientSessionSnapshot,
  type ClientMessengerSessionSnapshot,
} from '@/features/messenger-client/client-section-navigation';
import {
  isConversationReadPayload,
  isConversationSummaryPayload,
  isCoreConversationMessagePayload,
} from './messenger-realtime-payload';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function summary(id: string, zone: 'INTERNAL' | 'CLIENT' = 'INTERNAL'): MessengerCoreConversationRow {
  return {
    id,
    zone,
    type: 'DIRECT',
    title: id,
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastMessageAt: '2026-09-01T00:00:00.000Z',
    lastMessagePreview: 'old',
    unreadCount: 0,
  };
}

function payload(
  overrides: Partial<MessengerWsConversationSummaryPayload> = {},
): MessengerWsConversationSummaryPayload {
  return {
    conversationId: 'inactive',
    zone: 'INTERNAL',
    lastMessageAt: '2026-09-05T12:00:00.000Z',
    lastMessagePreview: 'hello',
    unreadCount: 3,
    lastReadAt: null,
    ...overrides,
  };
}

function readPayload(
  overrides: Partial<MessengerWsConversationReadUpdatedPayload> = {},
): MessengerWsConversationReadUpdatedPayload {
  return {
    scope: 'conversation',
    conversationId: 'c1',
    unreadCount: 0,
    zone: 'INTERNAL',
    lastReadAt: '2026-09-05T12:00:00.000Z',
    ...overrides,
  };
}

describe('messenger realtime cache reducers', () => {
  it('patches an inactive accessible summary from absolute unread without creating a thread cache', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('inactive')] });
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', payload());
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', payload());
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    expect(cached?.items[0]?.unreadCount).toBe(3);
    expect(cached?.items[0]?.lastMessagePreview).toBe('hello');
    expect(queryClient.getQueryData(messengerQueryKeys.messages('inactive'))).toBeUndefined();
  });

  it('does not increment unread from a thread message event', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('inactive')] });
    applyMessengerRealtimeMessage(queryClient, {
      id: 'm1',
      conversationId: 'inactive',
      senderId: 'e1',
      senderName: 'Ada',
      content: 'hello',
      createdAt: '2026-09-05T12:00:00.000Z',
      editedAt: null,
      attachments: [],
    });
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    expect(cached?.items[0]?.unreadCount).toBe(0);
    expect(cached?.items[0]?.lastMessagePreview).toBe('old');
  });

  it('patches exactly one conversation unread without invalidating the list', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, {
      items: [summary('c1'), { ...summary('c2'), unreadCount: 2 }],
    });
    applyMessengerRealtimeRead(queryClient, 'INTERNAL', readPayload());
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    expect(cached?.items[0]?.unreadCount).toBe(0);
    expect(cached?.items[1]?.unreadCount).toBe(2);
    expect(queryClient.getQueryCache().find({ queryKey: key, exact: true })?.state.isInvalidated).toBe(
      false,
    );
  });

  it('rejects cross-zone summary and read payloads', () => {
    const queryClient = createClient();
    const internalKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    const clientKey = messengerQueryKeys.clientSummaries({
      section: 'inbox',
      q: '',
      filter: 'all',
      provider: '',
    });
    queryClient.setQueryData(internalKey, { items: [summary('c1')] });
    queryClient.setQueryData(clientKey, { items: [summary('c1', 'CLIENT')] });
    applyMessengerRealtimeSummary(queryClient, 'CLIENT', payload({ conversationId: 'c1' }));
    applyMessengerRealtimeRead(
      queryClient,
      'INTERNAL',
      readPayload({ unreadCount: 9, zone: 'CLIENT' }),
    );
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(internalKey)?.items[0]
        ?.unreadCount,
    ).toBe(0);
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(clientKey)?.items[0]
        ?.lastMessagePreview,
    ).toBe('old');
  });

  it('invalidates the zone summary root when the row is missing instead of inserting', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('other')] });
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', payload({ conversationId: 'missing' }));
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    expect(cached?.items.map((row) => row.id)).toEqual(['other']);
    expect(queryClient.getQueryCache().find({ queryKey: key, exact: true })?.state.isInvalidated).toBe(
      true,
    );
  });

  it('invalidates zone summaries and the active messages query once on reconnect recovery', () => {
    const queryClient = createClient();
    const summaryKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    const messageKey = messengerQueryKeys.messages('B');
    queryClient.setQueryData(summaryKey, { items: [summary('B')] });
    queryClient.setQueryData(messageKey, { items: [], meta: { hasMoreOlder: false } });
    recoverMessengerRealtimeQueries(queryClient, 'INTERNAL', 'B');
    expect(
      queryClient.getQueryCache().find({ queryKey: summaryKey, exact: true })?.state.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryCache().find({ queryKey: messageKey, exact: true })?.state.isInvalidated,
    ).toBe(true);
  });
});

describe('applyMessengerAccessChanged', () => {
  it('removes the row so a failed refetch cannot keep title/preview', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    const entityKey = messengerQueryKeys.internalEntity('project', 'p1');
    queryClient.setQueryData(key, {
      items: [summary('lost'), summary('keep')],
    });
    queryClient.setQueryData(messengerQueryKeys.messages('lost'), {
      items: [],
      meta: { hasMoreOlder: false },
    });
    queryClient.setQueryData(entityKey, summary('lost'));
    applyMessengerRealtimeRead(queryClient, 'INTERNAL', readPayload({ conversationId: 'lost' }));
    applyMessengerAccessChanged(queryClient, 'INTERNAL', 'lost', 'INTERNAL');
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    expect(cached?.items.map((row) => row.id)).toEqual(['keep']);
    expect(cached?.items[0]?.title).not.toBe('lost');
    expect(queryClient.getQueryData(messengerQueryKeys.messages('lost'))).toBeUndefined();
    expect(queryClient.getQueryData(entityKey)).toBeUndefined();
    expect(getReadWatermark(queryClient, 'INTERNAL', 'lost')).toBeNull();
  });

  it('clears the active Client composer and ignores cross-zone signals', () => {
    const queryClient = createClient();
    const clientKey = messengerQueryKeys.clientSummaries({
      section: 'inbox',
      q: '',
      filter: 'all',
      provider: '',
    });
    queryClient.setQueryData(clientKey, { items: [summary('lost', 'CLIENT')] });
    let session: ClientMessengerSessionSnapshot = {
      ...createClientSessionSnapshot('inbox'),
      activeId: 'lost',
      newMessage: 'draft',
      unlockedId: 'lost',
    };
    const applied = applyMessengerAccessChanged(
      queryClient,
      'CLIENT',
      'lost',
      'CLIENT',
      {
        activeId: session.activeId,
        clearActive: () => {
          session = applyClientActiveId(session, null);
        },
      },
    );
    expect(applied).toBe(true);
    expect(session.activeId).toBeNull();
    expect(session.newMessage).toBe('');
    expect(session.unlockedId).toBeNull();
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(clientKey)?.items,
    ).toEqual([]);
    const internalKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(internalKey, { items: [summary('lost')] });
    expect(applyMessengerAccessChanged(queryClient, 'INTERNAL', 'lost', 'CLIENT')).toBe(false);
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(internalKey)?.items[0]
        ?.title,
    ).toBe('lost');
  });
});

describe('messenger realtime payload guards', () => {
  it('rejects malformed summary payloads', () => {
    expect(isConversationSummaryPayload({ conversationId: 'c1' })).toBe(false);
    expect(isConversationSummaryPayload(payload({ unreadCount: 1.5 }))).toBe(false);
    expect(isConversationSummaryPayload(payload({ lastReadAt: 'not-a-date' }))).toBe(false);
    expect(isConversationSummaryPayload(payload({ lastMessageAt: 'yesterday' }))).toBe(false);
    expect(isConversationSummaryPayload(payload({ zone: 'INTERNAL', unreadCount: 1 }))).toBe(true);
    expect(isConversationReadPayload(readPayload({ lastReadAt: 'nope' }))).toBe(false);
    expect(isConversationReadPayload(readPayload())).toBe(true);
    expect(
      isCoreConversationMessagePayload({
        conversationId: 'c1',
        message: { id: 'm1', conversationId: 'c2' },
      }),
    ).toBe(false);
  });
});
