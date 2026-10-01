import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import {
  MESSENGER_WS_SERVER_CONVERSATION_FAVORITE,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_PEER_READ,
} from '@nbos/shared';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { messengerQueryKeys } from './messenger-query-keys';
import { applyMessengerCoreSocketEvent } from '../realtime/messenger-realtime-cache-bind';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function message(
  id: string,
  status: MessengerCoreMessageRow['status'],
  extras: Partial<MessengerCoreMessageRow> = {},
): MessengerCoreMessageRow {
  return {
    id,
    conversationId: 'c1',
    senderId: 'e1',
    senderName: 'Ada',
    content: 'hi',
    createdAt: '2026-10-01T12:00:00.000Z',
    editedAt: null,
    status,
    direction: 'OUTBOUND',
    attachments: [],
    ...extras,
  };
}

function summary(): MessengerCoreConversationRow {
  return {
    id: 'c1',
    zone: 'INTERNAL',
    type: 'DIRECT',
    title: 'c1',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastMessageAt: '2026-10-01T12:00:00.000Z',
    lastMessagePreview: 'hi',
    unreadCount: 0,
    isFavorite: false,
  };
}

describe('phase 4 lifecycle cache', () => {
  it('removes a revoked row from an open thread and ignores a duplicate tombstone', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.messages('c1');
    queryClient.setQueryData(key, {
      items: [message('m1', 'DELIVERED')],
      meta: { hasMoreOlder: false },
    });
    const tombstone = message('m1', 'DELIVERED', { deletedAt: '2026-10-01T12:05:00.000Z' });
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: 'c1',
      message: tombstone,
    });
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: 'c1',
      message: tombstone,
    });
    expect(queryClient.getQueryData<{ items: MessengerCoreMessageRow[] }>(key)?.items).toEqual([]);
  });

  it('updates favorite on the summary without refetching the list', () => {
    const queryClient = createClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary()], mentionsAvailable: true });
    const payload = { conversationId: 'c1', zone: 'INTERNAL', favorite: true };
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_FAVORITE, payload);
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_FAVORITE, payload);
    const items = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key)?.items;
    expect(items).toHaveLength(1);
    expect(items?.[0]?.isFavorite).toBe(true);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('does not let an older delivery status replace READ', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.messages('c1');
    queryClient.setQueryData(key, {
      items: [message('m1', 'READ')],
      meta: { hasMoreOlder: false },
    });
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: 'c1',
      message: message('m1', 'DELIVERED'),
    });
    expect(
      queryClient.getQueryData<{ items: MessengerCoreMessageRow[] }>(key)?.items[0]?.status,
    ).toBe('READ');
  });

  it('does not append a duplicate message or double-apply peer read', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.messages('c1');
    queryClient.setQueryData(key, {
      items: [
        message('m1', 'DELIVERED', { senderId: 'e1', createdAt: '2026-10-01T12:00:00.000Z' }),
      ],
      meta: { hasMoreOlder: false },
    });
    const live = message('m1', 'DELIVERED');
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: 'c1',
      message: live,
    });
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: 'c1',
      message: live,
    });
    const peer = {
      conversationId: 'c1',
      readerId: 'e2',
      lastReadAt: '2026-10-01T12:01:00.000Z',
    };
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_PEER_READ, peer);
    applyMessengerCoreSocketEvent(queryClient, MESSENGER_WS_SERVER_CONVERSATION_PEER_READ, peer);
    const items = queryClient.getQueryData<{ items: MessengerCoreMessageRow[] }>(key)?.items;
    expect(items).toHaveLength(1);
    expect(items?.[0]?.status).toBe('READ');
  });
});
