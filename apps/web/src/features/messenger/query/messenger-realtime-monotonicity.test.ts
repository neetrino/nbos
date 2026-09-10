import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type {
  MessengerWsConversationReadUpdatedPayload,
  MessengerWsConversationSummaryPayload,
} from '@nbos/shared';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from './messenger-query-keys';
import { applyMessengerRealtimeRead, applyMessengerRealtimeSummary } from './messenger-realtime-cache';
import { getReadWatermark } from './messenger-realtime-watermarks';

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
    unreadCount: 0,
  };
}

function payload(
  overrides: Partial<MessengerWsConversationSummaryPayload> = {},
): MessengerWsConversationSummaryPayload {
  return {
    conversationId: 'c1',
    zone: 'INTERNAL',
    lastMessageAt: '2026-09-05T12:00:00.000Z',
    lastMessagePreview: 'hello',
    unreadCount: 1,
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

describe('in-session summary/read monotonicity', () => {
  it('keeps M2 preview/time/order/unread when M1 arrives later', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('c1'), summary('c2')] });
    applyMessengerRealtimeSummary(
      queryClient,
      'INTERNAL',
      payload({
        lastMessageAt: '2026-09-05T13:00:00.000Z',
        lastMessagePreview: 'm2',
      }),
    );
    applyMessengerRealtimeSummary(
      queryClient,
      'INTERNAL',
      payload({
        lastMessageAt: '2026-09-05T12:00:00.000Z',
        lastMessagePreview: 'm1',
      }),
    );
    const items = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key)?.items;
    expect(items?.[0]?.id).toBe('c1');
    expect(items?.[0]?.lastMessagePreview).toBe('m2');
    expect(items?.[0]?.lastMessageAt).toBe('2026-09-05T13:00:00.000Z');
    expect(items?.[0]?.unreadCount).toBe(1);
  });

  it('keeps unread 0 after read when a delayed duplicate M1 summary says 1', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('c1')] });
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', payload());
    applyMessengerRealtimeRead(queryClient, 'INTERNAL', readPayload());
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', payload());
    const row = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key)?.items[0];
    expect(row?.unreadCount).toBe(0);
    expect(row?.lastMessagePreview).toBe('hello');
  });

  it('forces unread 0 when a delayed summary is at or before the read watermark', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('c1')] });
    applyMessengerRealtimeRead(queryClient, 'INTERNAL', readPayload());
    applyMessengerRealtimeSummary(queryClient, 'INTERNAL', payload({ unreadCount: 1 }));
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key)?.items[0]?.unreadCount,
    ).toBe(0);
  });

  it('does not let an older read overwrite a newer watermark or unread', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [{ ...summary('c1'), unreadCount: 1 }] });
    applyMessengerRealtimeRead(
      queryClient,
      'INTERNAL',
      readPayload({ lastReadAt: '2026-09-05T13:00:00.000Z' }),
    );
    applyMessengerRealtimeRead(
      queryClient,
      'INTERNAL',
      readPayload({ unreadCount: 1, lastReadAt: '2026-09-05T11:00:00.000Z' }),
    );
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key)?.items[0]?.unreadCount,
    ).toBe(0);
    expect(getReadWatermark(queryClient, 'INTERNAL', 'c1')).toBe('2026-09-05T13:00:00.000Z');
  });

  it('allows a newer message after the watermark to become unread', () => {
    const queryClient = createClient();
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, { items: [summary('c1')] });
    applyMessengerRealtimeRead(queryClient, 'INTERNAL', readPayload());
    applyMessengerRealtimeSummary(
      queryClient,
      'INTERNAL',
      payload({
        lastMessageAt: '2026-09-05T13:00:00.000Z',
        lastMessagePreview: 'm2',
      }),
    );
    expect(
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(key)?.items[0],
    ).toMatchObject({ lastMessagePreview: 'm2', unreadCount: 1 });
  });
});
