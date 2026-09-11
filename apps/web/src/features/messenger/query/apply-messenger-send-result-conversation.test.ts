import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { applyMessengerSendResult, type MessengerMessagesPage } from './messenger-cache';
import { deriveInternalVisibleSummaries } from './derive-internal-summaries';
import { messengerQueryKeys } from './messenger-query-keys';
import { applyMessengerRealtimeSummary } from './messenger-realtime-cache';
import {
  isMessengerDefaultCacheFresh,
  remainingMessengerDefaultFreshMs,
} from './seed-messenger-bootstrap';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function conversation(
  overrides: Partial<MessengerCoreConversationRow> = {},
): MessengerCoreConversationRow {
  return {
    id: 'task-conv',
    zone: 'INTERNAL',
    type: 'TASK',
    title: 'Ship cache fix',
    status: 'ACTIVE',
    canonicalKey: 'task:task-1',
    createdAt: '2026-09-11T10:00:00.000Z',
    lastMessageAt: '2026-09-11T12:00:00.000Z',
    lastMessagePreview: 'First note',
    unreadCount: 0,
    peerEmployeeId: null,
    peerName: null,
    isFavorite: false,
    canWrite: true,
    ...overrides,
  };
}

function message(overrides: Partial<MessengerCoreMessageRow> = {}): MessengerCoreMessageRow {
  return {
    id: 'm1',
    conversationId: 'task-conv',
    senderId: 'emp-1',
    senderName: 'Ada',
    content: 'First note',
    createdAt: '2026-09-11T12:00:00.000Z',
    editedAt: null,
    attachments: [],
    ...overrides,
  };
}

function ids(queryClient: QueryClient, key: readonly unknown[]): string[] {
  return (
    queryClient
      .getQueryData<{ items: MessengerCoreConversationRow[] }>(key)
      ?.items.map((row) => row.id) ?? []
  );
}

function row(
  queryClient: QueryClient,
  key: readonly unknown[],
  id: string,
): MessengerCoreConversationRow | undefined {
  return queryClient
    .getQueryData<{ items: MessengerCoreConversationRow[] }>(key)
    ?.items.find((item) => item.id === id);
}

describe('applyMessengerSendResult conversation upsert', () => {
  const allKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
  const tasksKey = messengerQueryKeys.internalSummaries({
    source: 'section',
    section: 'tasks',
    q: '',
    filter: 'all',
  });
  const productsKey = messengerQueryKeys.internalSummaries({
    source: 'section',
    section: 'products',
    q: '',
    filter: 'all',
  });
  const groupsKey = messengerQueryKeys.internalSummaries({
    source: 'section',
    section: 'groups',
    q: '',
    filter: 'all',
  });

  it('inserts a first Task conversation into All and Tasks without refetch', () => {
    const queryClient = createClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(allKey, { items: [] });
    queryClient.setQueryData(tasksKey, { items: [] });
    queryClient.setQueryData(productsKey, {
      items: [conversation({ id: 'p1', type: 'PRODUCT', title: 'Product' })],
    });
    queryClient.setQueryData(groupsKey, { items: [] });
    applyMessengerSendResult(queryClient, 'INTERNAL', message(), conversation({ unreadCount: 0 }));
    expect(ids(queryClient, allKey)).toEqual(['task-conv']);
    expect(ids(queryClient, tasksKey)).toEqual(['task-conv']);
    expect(ids(queryClient, productsKey)).toEqual(['p1']);
    expect(ids(queryClient, groupsKey)).toEqual([]);
    expect(row(queryClient, allKey, 'task-conv')?.unreadCount).toBe(0);
    expect(row(queryClient, allKey, 'task-conv')?.lastMessagePreview).toBe('First note');
    expect(invalidate).not.toHaveBeenCalled();
    const thread = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages('task-conv'),
    );
    expect(thread?.items.map((item) => item.id)).toEqual(['m1']);
  });

  it('updates preview and order on a subsequent send without duplicating', () => {
    const queryClient = createClient();
    const older = conversation({
      id: 'older',
      lastMessageAt: '2026-09-11T11:00:00.000Z',
      lastMessagePreview: 'older',
    });
    queryClient.setQueryData(allKey, { items: [older, conversation()] });
    applyMessengerSendResult(
      queryClient,
      'INTERNAL',
      message({
        id: 'm2',
        content: 'Second note',
        createdAt: '2026-09-11T13:00:00.000Z',
      }),
      conversation({
        lastMessageAt: '2026-09-11T13:00:00.000Z',
        lastMessagePreview: 'Second note',
      }),
    );
    expect(ids(queryClient, allKey)).toEqual(['task-conv', 'older']);
    expect(row(queryClient, allKey, 'task-conv')?.lastMessagePreview).toBe('Second note');
  });

  it('keeps one row when local upsert is followed by realtime summary', () => {
    const queryClient = createClient();
    queryClient.setQueryData(allKey, { items: [] });
    applyMessengerSendResult(queryClient, 'INTERNAL', message(), conversation());
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', {
      conversationId: 'task-conv',
      zone: 'INTERNAL',
      lastMessageAt: '2026-09-11T12:00:00.000Z',
      lastMessagePreview: 'First note',
      unreadCount: 0,
      lastReadAt: null,
    });
    expect(ids(queryClient, allKey)).toEqual(['task-conv']);
    expect(row(queryClient, allKey, 'task-conv')?.lastMessagePreview).toBe('First note');
  });

  it('does not roll preview back when an older send result arrives second', () => {
    const queryClient = createClient();
    queryClient.setQueryData(allKey, { items: [] });
    applyMessengerSendResult(
      queryClient,
      'INTERNAL',
      message({
        id: 'm2',
        content: 'B',
        createdAt: '2026-09-11T12:01:00.000Z',
      }),
      conversation({ lastMessageAt: '2026-09-11T12:01:00.000Z', lastMessagePreview: 'B' }),
    );
    applyMessengerSendResult(
      queryClient,
      'INTERNAL',
      message({
        id: 'm1',
        content: 'A',
        createdAt: '2026-09-11T12:00:00.000Z',
      }),
      conversation({ lastMessageAt: '2026-09-11T12:00:00.000Z', lastMessagePreview: 'A' }),
    );
    expect(ids(queryClient, allKey)).toEqual(['task-conv']);
    expect(row(queryClient, allKey, 'task-conv')?.lastMessagePreview).toBe('B');
    expect(row(queryClient, allKey, 'task-conv')?.lastMessageAt).toBe('2026-09-11T12:01:00.000Z');
  });

  it('makes the Task visible in All and Tasks derivation without bootstrap', () => {
    const queryClient = createClient();
    queryClient.setQueryData(allKey, {
      items: [conversation({ id: 'keep', type: 'DIRECT', title: 'Ada' })],
    });
    applyMessengerSendResult(queryClient, 'INTERNAL', message(), conversation());
    const items =
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(allKey)?.items ?? [];
    expect(deriveInternalVisibleSummaries(items, 'all', 'all').map((item) => item.id)).toEqual([
      'task-conv',
      'keep',
    ]);
    expect(deriveInternalVisibleSummaries(items, 'tasks', 'all').map((item) => item.id)).toEqual([
      'task-conv',
    ]);
  });

  it('upserts into a fresh persisted inbox without invalidating bootstrap', () => {
    const queryClient = createClient();
    queryClient.setQueryData(allKey, { items: [] });
    queryClient.setQueryData(messengerQueryKeys.collections('INTERNAL'), []);
    expect(isMessengerDefaultCacheFresh(queryClient, 'INTERNAL')).toBe(true);
    const remainingBefore = remainingMessengerDefaultFreshMs(queryClient, 'INTERNAL');
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    applyMessengerSendResult(queryClient, 'INTERNAL', message(), conversation());
    expect(ids(queryClient, allKey)).toEqual(['task-conv']);
    expect(isMessengerDefaultCacheFresh(queryClient, 'INTERNAL')).toBe(true);
    expect(remainingMessengerDefaultFreshMs(queryClient, 'INTERNAL')).toBeGreaterThan(0);
    expect(remainingMessengerDefaultFreshMs(queryClient, 'INTERNAL')).toBeLessThanOrEqual(
      remainingBefore,
    );
    expect(invalidate).not.toHaveBeenCalled();
  });
});
