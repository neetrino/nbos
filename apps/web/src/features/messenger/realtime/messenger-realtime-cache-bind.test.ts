import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import {
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_SUMMARY,
  MESSENGER_WS_SERVER_READ_UPDATED,
} from '@nbos/shared';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { applyMessengerCoreSocketEvent } from './messenger-realtime-cache-bind';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function message(id: string, conversationId: string): MessengerCoreMessageRow {
  return {
    id,
    conversationId,
    senderId: 'e1',
    senderName: 'Ada',
    content: 'live',
    createdAt: '2026-09-05T12:00:00.000Z',
    editedAt: null,
    attachments: [],
  };
}

describe('messenger core socket cache bind', () => {
  it('ignores malformed summary and thread payloads', () => {
    const queryClient = createClient();
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_SUMMARY, {
      conversationId: 'c1',
    });
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: 'c1',
      message: { id: 'm1', conversationId: 'other' },
    });
    expect(queryClient.getQueryData(messengerQueryKeys.messages('c1'))).toBeUndefined();
  });

  it('patches a cached thread and a summary while no chat surface is open', () => {
    const queryClient = createClient();
    const summaryKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(summaryKey, {
      items: [
        {
          id: 'c1',
          zone: 'INTERNAL',
          type: 'DIRECT',
          title: 'c1',
          status: 'ACTIVE',
          canonicalKey: null,
          createdAt: '2026-09-01T00:00:00.000Z',
          lastMessageAt: '2026-09-01T00:00:00.000Z',
          lastMessagePreview: 'old',
          unreadCount: 0,
        },
      ],
      mentionsAvailable: true,
    });
    queryClient.setQueryData(messengerQueryKeys.messages('c1'), {
      items: [],
      meta: { hasMoreOlder: false },
    });
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: 'c1',
      message: message('m1', 'c1'),
    });
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_SUMMARY, {
      conversationId: 'c1',
      zone: 'INTERNAL',
      lastMessageAt: '2026-09-05T12:00:00.000Z',
      lastMessagePreview: 'live',
      unreadCount: 2,
      lastReadAt: null,
    });
    const thread = queryClient.getQueryData<{ items: MessengerCoreMessageRow[] }>(
      messengerQueryKeys.messages('c1'),
    );
    expect(thread?.items.map((row) => row.id)).toEqual(['m1']);
    const summaries = queryClient.getQueryData<{ items: Array<{ unreadCount?: number }> }>(
      summaryKey,
    );
    expect(summaries?.items[0]?.unreadCount).toBe(2);
  });

  it('routes conversation read without treating it as a list invalidation', () => {
    const queryClient = createClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_READ_UPDATED, {
      scope: 'conversation',
      conversationId: 'c1',
      unreadCount: 0,
      zone: 'INTERNAL',
      lastReadAt: '2026-09-05T12:00:00.000Z',
    });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('purges a revoked conversation even when no thread is open', () => {
    const queryClient = createClient();
    const summaryKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(summaryKey, {
      items: [
        {
          id: 'lost',
          zone: 'INTERNAL',
          type: 'DIRECT',
          title: 'lost',
          status: 'ACTIVE',
          canonicalKey: null,
          createdAt: '2026-09-01T00:00:00.000Z',
          lastMessageAt: null,
        },
      ],
      mentionsAvailable: true,
    });
    const access = applyMessengerCoreSocketEvent(
      queryClient,
      MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
      { conversationId: 'lost', zone: 'INTERNAL' },
    );
    expect(access).toEqual({ conversationId: 'lost', zone: 'INTERNAL' });
    expect(queryClient.getQueryData<{ items: unknown[] }>(summaryKey)?.items).toEqual([]);
  });
});
