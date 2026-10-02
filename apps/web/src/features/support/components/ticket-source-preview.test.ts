import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { MESSENGER_WS_SERVER_CONVERSATION_MESSAGE } from '@nbos/shared';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { applyMessengerCoreSocketEvent } from '@/features/messenger/realtime/messenger-realtime-cache-bind';
import { invalidateTicketSourceList, ticketSourceQueryKey } from './ticket-source-query';

type SourceRow = {
  referenceId: string;
  sourceMessageId: string;
  sourceConversationId: string;
  sortOrder: number;
  preview: string | null;
  canOpen: boolean;
};

type OpenTicket = {
  client: QueryClient;
  observer: QueryObserver<SourceRow[]>;
  rows: SourceRow[];
  fetches: () => number;
};

describe('open ticket source preview', () => {
  let unsubscribe: (() => void) | null = null;

  afterEach(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  it('refetches an edit when the conversation message query is absent', async () => {
    const ticket = await openTicket('Pay the invoice', (release) => {
      unsubscribe = release;
    });
    ticket.rows = [sourceRow('Pay the invoice — edited')];
    applyMessage(
      ticket.client,
      canonicalMessage('msg-1', 'conv-1', {
        content: 'Pay the invoice — edited',
        editedAt: '2026-10-01T12:05:00.000Z',
      }),
    );
    await waitForPreview(ticket, 'Pay the invoice — edited');
    expect(ticket.client.getQueryData(messengerQueryKeys.messages('conv-1'))).toBeUndefined();
  });

  it('refetches a revoke without copying the thread', async () => {
    const ticket = await openTicket('Pay the invoice', (release) => {
      unsubscribe = release;
    });
    ticket.rows = [sourceRow(null)];
    applyMessage(
      ticket.client,
      canonicalMessage('msg-1', 'conv-1', {
        deletedAt: '2026-10-01T12:06:00.000Z',
      }),
    );
    await waitForPreview(ticket, null);
    expect(ticket.client.getQueryData(messengerQueryKeys.messages('conv-1'))).toBeUndefined();
  });

  it('does not refetch when a different canonical message changes', async () => {
    const ticket = await openTicket('Pay the invoice', (release) => {
      unsubscribe = release;
    });
    const fetches = ticket.fetches();
    applyMessage(ticket.client, canonicalMessage('msg-other', 'conv-1', { content: 'unrelated' }));
    await flushTick();
    expect(ticket.fetches()).toBe(fetches);
    expect(ticket.observer.getCurrentResult().data?.[0]?.preview).toBe('Pay the invoice');
    expect(ticket.client.getQueryData(messengerQueryKeys.messages('conv-1'))).toBeUndefined();
  });

  it('still refetches after a same-tab attach invalidation', async () => {
    const ticket = await openTicket('Pay the invoice', (release) => {
      unsubscribe = release;
    });
    ticket.rows = [sourceRow('Attached later')];
    invalidateTicketSourceList(ticket.client, 'ticket-1');
    await waitForPreview(ticket, 'Attached later');
  });
});

async function openTicket(
  preview: string,
  capture: (release: () => void) => void,
): Promise<OpenTicket> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const state = { rows: [sourceRow(preview)], fetches: 0 };
  const observer = new QueryObserver<SourceRow[]>(client, {
    queryKey: ticketSourceQueryKey('ticket-1'),
    queryFn: async () => {
      state.fetches += 1;
      return state.rows;
    },
  });
  capture(observer.subscribe(() => undefined));
  await observer.refetch();
  return {
    client,
    observer,
    get rows() {
      return state.rows;
    },
    set rows(rows: SourceRow[]) {
      state.rows = rows;
    },
    fetches: () => state.fetches,
  };
}

function applyMessage(client: QueryClient, message: MessengerCoreMessageRow): void {
  applyMessengerCoreSocketEvent(client, MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
    conversationId: message.conversationId,
    message,
  });
}

function sourceRow(preview: string | null): SourceRow {
  return {
    referenceId: 'ref-1',
    sourceMessageId: 'msg-1',
    sourceConversationId: 'conv-1',
    sortOrder: 0,
    preview,
    canOpen: true,
  };
}

function canonicalMessage(
  id: string,
  conversationId: string,
  extras: Partial<MessengerCoreMessageRow>,
): MessengerCoreMessageRow {
  return {
    id,
    conversationId,
    senderId: null,
    senderName: 'Ada',
    content: 'Pay the invoice',
    createdAt: '2026-10-01T12:00:00.000Z',
    editedAt: null,
    attachments: [],
    ...extras,
  };
}

async function waitForPreview(ticket: OpenTicket, preview: string | null): Promise<void> {
  const started = Date.now();
  while (ticket.observer.getCurrentResult().data?.[0]?.preview !== preview) {
    if (Date.now() - started > 1000) throw new Error('ticket preview did not converge');
    await flushTick();
  }
}

function flushTick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
