import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { upsertConversationSummary } from './messenger-cache';
import { messengerQueryKeys } from './messenger-query-keys';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function conversation(
  overrides: Partial<MessengerCoreConversationRow>,
): MessengerCoreConversationRow {
  return {
    id: 'row',
    zone: 'INTERNAL',
    type: 'DIRECT',
    title: 'Row',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastMessageAt: '2026-09-01T00:00:00.000Z',
    lastMessagePreview: 'old',
    unreadCount: 0,
    ...overrides,
  };
}

function ids(queryClient: QueryClient, key: readonly unknown[]): string[] {
  return (
    queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key)?.items.map(
      (row) => row.id,
    ) ?? []
  );
}

function isInvalidated(queryClient: QueryClient, key: readonly unknown[]): boolean {
  return Boolean(queryClient.getQueryCache().find({ queryKey: key, exact: true })?.state.isInvalidated);
}

describe('upsertConversationSummary membership safety', () => {
  it('does not insert a created Group into Products, Tasks, search, or mentions', () => {
    const queryClient = createClient();
    const allKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    const productsKey = messengerQueryKeys.internalSummaries({
      source: 'section',
      section: 'products',
      q: '',
      filter: 'all',
    });
    const tasksKey = messengerQueryKeys.internalSummaries({
      source: 'section',
      section: 'tasks',
      q: '',
      filter: 'all',
    });
    const searchKey = messengerQueryKeys.internalSummaries({
      source: 'section',
      section: 'all',
      q: 'invoice',
      filter: 'all',
    });
    const mentionsKey = messengerQueryKeys.internalSummaries({
      source: 'section',
      section: 'all',
      q: '',
      filter: 'mentions',
    });
    const product = conversation({ id: 'p1', type: 'PRODUCT', title: 'Product' });
    const task = conversation({ id: 't1', type: 'TASK', title: 'Task' });
    queryClient.setQueryData(allKey, { items: [] });
    queryClient.setQueryData(productsKey, { items: [product] });
    queryClient.setQueryData(tasksKey, { items: [task] });
    queryClient.setQueryData(searchKey, { items: [product] });
    queryClient.setQueryData(mentionsKey, { items: [task] });

    const group = conversation({
      id: 'g1',
      type: 'INTERNAL_GROUP',
      title: 'New group',
      lastMessageAt: '2026-09-05T12:00:00.000Z',
    });
    upsertConversationSummary(queryClient, 'INTERNAL', group);

    expect(ids(queryClient, allKey)).toEqual(['g1']);
    expect(ids(queryClient, productsKey)).toEqual(['p1']);
    expect(ids(queryClient, tasksKey)).toEqual(['t1']);
    expect(ids(queryClient, searchKey)).toEqual(['p1']);
    expect(ids(queryClient, mentionsKey)).toEqual(['t1']);
    expect(isInvalidated(queryClient, productsKey)).toBe(false);
    expect(isInvalidated(queryClient, tasksKey)).toBe(false);
    expect(isInvalidated(queryClient, searchKey)).toBe(true);
    expect(isInvalidated(queryClient, mentionsKey)).toBe(true);
  });

  it('patches an existing Internal row without inserting it elsewhere', () => {
    const queryClient = createClient();
    const productsKey = messengerQueryKeys.internalSummaries({
      source: 'section',
      section: 'products',
      q: '',
      filter: 'all',
    });
    const tasksKey = messengerQueryKeys.internalSummaries({
      source: 'section',
      section: 'tasks',
      q: '',
      filter: 'all',
    });
    const product = conversation({ id: 'p1', type: 'PRODUCT', title: 'Product' });
    queryClient.setQueryData(productsKey, { items: [product] });
    queryClient.setQueryData(tasksKey, { items: [] });
    upsertConversationSummary(
      queryClient,
      'INTERNAL',
      conversation({ id: 'p1', type: 'PRODUCT', title: 'Updated', lastMessagePreview: 'now' }),
    );
    expect(ids(queryClient, productsKey)).toEqual(['p1']);
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(productsKey)?.items[0]
        ?.title,
    ).toBe('Updated');
    expect(ids(queryClient, tasksKey)).toEqual([]);
  });

  it('does not insert an archived conversation into All or typed active sections', () => {
    const queryClient = createClient();
    const allKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    const groupsKey = messengerQueryKeys.internalSummaries({
      source: 'section',
      section: 'groups',
      q: '',
      filter: 'all',
    });
    queryClient.setQueryData(allKey, { items: [] });
    queryClient.setQueryData(groupsKey, { items: [] });
    upsertConversationSummary(
      queryClient,
      'INTERNAL',
      conversation({ id: 'archived', type: 'INTERNAL_GROUP', status: 'ARCHIVED' }),
    );
    expect(ids(queryClient, allKey)).toEqual([]);
    expect(ids(queryClient, groupsKey)).toEqual([]);
    expect(isInvalidated(queryClient, allKey)).toBe(false);
    expect(isInvalidated(queryClient, groupsKey)).toBe(false);
  });

  it('still patches an archived row that is already present', () => {
    const queryClient = createClient();
    const allKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    const existing = conversation({ id: 'archived', type: 'INTERNAL_GROUP', status: 'ARCHIVED' });
    queryClient.setQueryData(allKey, { items: [existing] });
    upsertConversationSummary(
      queryClient,
      'INTERNAL',
      conversation({
        id: 'archived',
        type: 'INTERNAL_GROUP',
        status: 'ARCHIVED',
        lastMessagePreview: 'updated',
      }),
    );
    expect(ids(queryClient, allKey)).toEqual(['archived']);
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(allKey)?.items[0]
        ?.lastMessagePreview,
    ).toBe('updated');
  });

  it('does not insert a Client conversation into unrelated Client query variants', () => {
    const queryClient = createClient();
    const inboxKey = messengerQueryKeys.clientSummaries({
      section: 'inbox',
      q: '',
      filter: 'all',
      provider: '',
    });
    const salesKey = messengerQueryKeys.clientSummaries({
      section: 'sales',
      q: '',
      filter: 'all',
      provider: '',
    });
    const clientsKey = messengerQueryKeys.clientSummaries({
      section: 'clients',
      q: '',
      filter: 'all',
      provider: '',
    });
    const unreadKey = messengerQueryKeys.clientSummaries({
      section: 'inbox',
      q: '',
      filter: 'unread',
      provider: '',
    });
    const searchKey = messengerQueryKeys.clientSummaries({
      section: 'inbox',
      q: 'acme',
      filter: 'all',
      provider: '',
    });
    const providerKey = messengerQueryKeys.clientSummaries({
      section: 'inbox',
      q: '',
      filter: 'all',
      provider: 'WHATSAPP',
    });
    const existing = conversation({ id: 'keep', zone: 'CLIENT', type: 'EXTERNAL' });
    queryClient.setQueryData(inboxKey, { items: [existing] });
    queryClient.setQueryData(salesKey, { items: [existing] });
    queryClient.setQueryData(clientsKey, { items: [existing] });
    queryClient.setQueryData(unreadKey, { items: [existing] });
    queryClient.setQueryData(searchKey, { items: [existing] });
    queryClient.setQueryData(providerKey, { items: [existing] });

    const opened = conversation({
      id: 'opened',
      zone: 'CLIENT',
      type: 'EXTERNAL',
      title: 'Opened',
    });
    upsertConversationSummary(queryClient, 'CLIENT', opened);

    expect(ids(queryClient, inboxKey)).toEqual(['keep']);
    expect(ids(queryClient, salesKey)).toEqual(['keep']);
    expect(ids(queryClient, clientsKey)).toEqual(['keep']);
    expect(ids(queryClient, unreadKey)).toEqual(['keep']);
    expect(ids(queryClient, searchKey)).toEqual(['keep']);
    expect(ids(queryClient, providerKey)).toEqual(['keep']);
    expect(isInvalidated(queryClient, inboxKey)).toBe(true);
    expect(isInvalidated(queryClient, salesKey)).toBe(true);
    expect(isInvalidated(queryClient, clientsKey)).toBe(true);
    expect(isInvalidated(queryClient, unreadKey)).toBe(true);
    expect(isInvalidated(queryClient, searchKey)).toBe(true);
    expect(isInvalidated(queryClient, providerKey)).toBe(true);
  });
});
