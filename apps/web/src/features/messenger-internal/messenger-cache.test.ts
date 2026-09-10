import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { MessengerCoreConversationRow, MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import {
  applyMessengerRealtimeMessage,
  applyMessengerSendResult,
  patchMessengerMessages,
  type MessengerMessagesPage,
} from '@/features/messenger/query/messenger-cache';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function message(id: string, conversationId: string, content = 'hello'): MessengerCoreMessageRow {
  return {
    id,
    conversationId,
    senderId: 'e1',
    senderName: 'Ada',
    content,
    createdAt: '2026-09-05T12:00:00.000Z',
    editedAt: null,
    attachments: [],
  };
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
    unreadCount: 0,
  };
}

describe('messenger cache patches', () => {
  it('keeps QueryClient cache after a simulated route remount', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('c1')], mentionsAvailable: true });
    const remounted = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    expect(remounted?.items).toHaveLength(1);
    expect(remounted?.items[0]?.id).toBe('c1');
  });

  it('retains cached summaries while a background patch runs', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('c1')], mentionsAvailable: true });
    applyMessengerSendResult(queryClient, 'INTERNAL', message('m1', 'c1', 'sent'));
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    expect(cached?.items).toHaveLength(1);
    expect(cached?.items[0]?.lastMessagePreview).toBe('sent');
  });

  it('patches a send result into the thread without duplicating the id', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.messages('c1');
    queryClient.setQueryData<MessengerMessagesPage>(key, {
      items: [message('m1', 'c1')],
      meta: { hasMoreOlder: false },
    });
    applyMessengerSendResult(queryClient, 'INTERNAL', message('m1', 'c1', 'sent'));
    applyMessengerSendResult(queryClient, 'INTERNAL', message('m2', 'c1', 'next'));
    const page = queryClient.getQueryData<MessengerMessagesPage>(key);
    expect(page?.items.map((row) => row.id)).toEqual(['m1', 'm2']);
  });

  it('keeps one message after REST result plus duplicate realtime', () => {
    const queryClient = createClient();
    applyMessengerSendResult(queryClient, 'INTERNAL', message('m1', 'c1'));
    applyMessengerRealtimeMessage(queryClient, message('m1', 'c1', 'live'));
    const page = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages('c1'),
    );
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]?.content).toBe('live');
  });

  it('isolates a slow conversation A response from active B', () => {
    const queryClient = createClient();
    const pageA: MessengerMessagesPage = {
      items: [message('a1', 'A', 'from-a')],
      meta: { hasMoreOlder: false },
    };
    const pageB: MessengerMessagesPage = {
      items: [message('b1', 'B', 'from-b')],
      meta: { hasMoreOlder: false },
    };
    queryClient.setQueryData(messengerQueryKeys.messages('B'), pageB);
    patchMessengerMessages(queryClient, 'A', message('a2', 'A', 'late-a'), {
      createIfMissing: true,
    });
    queryClient.setQueryData(messengerQueryKeys.messages('A'), pageA);
    const active = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages('B'),
    );
    expect(active?.items[0]?.content).toBe('from-b');
    expect(active?.items.some((row) => row.conversationId === 'A')).toBe(false);
  });

  it('does not create a thread cache for an unopened realtime conversation', () => {
    const queryClient = createClient();
    applyMessengerRealtimeMessage(queryClient, message('m1', 'other'));
    expect(queryClient.getQueryData(messengerQueryKeys.messages('other'))).toBeUndefined();
  });

  it('does not increment unread or reorder preview on a duplicate inactive inbound event', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, {
      items: [
        summary('inactive'),
        { ...summary('other'), lastMessageAt: '2026-08-01T00:00:00.000Z' },
      ],
    });
    const inbound = message('dup-1', 'inactive', 'first');
    applyMessengerRealtimeMessage(queryClient, inbound);
    const afterFirst = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    applyMessengerRealtimeMessage(queryClient, inbound);
    const afterDuplicate = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(
      key,
    );
    expect(afterFirst?.items.map((row) => row.id)).toEqual(['inactive', 'other']);
    expect(afterFirst?.items[0]?.unreadCount).toBe(0);
    expect(afterFirst?.items[0]?.lastMessagePreview).toBe('old');
    expect(afterDuplicate).toEqual(afterFirst);
  });

  it('does not reapply unread after REST send plus duplicate realtime', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('c1')] });
    applyMessengerSendResult(queryClient, 'INTERNAL', message('m1', 'c1', 'sent'));
    applyMessengerRealtimeMessage(queryClient, message('m1', 'c1', 'live'));
    const cached = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key);
    expect(cached?.items[0]?.unreadCount).toBe(0);
    expect(cached?.items[0]?.lastMessagePreview).toBe('sent');
  });
});
