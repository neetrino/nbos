// @vitest-environment jsdom

import { act, createElement, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MESSENGER_WS_CLIENT_LEAVE_CONVERSATION,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
} from '@nbos/shared';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { MessengerRealtimeHub } from '@/features/messenger/realtime/messenger-realtime-hub';
import type { MessengerClientSocket } from '@/features/messenger/realtime/messenger-socket-client';
import { useEntityConversation } from './use-entity-conversation';

vi.mock('@/lib/permissions/PermissionContext', () => ({
  usePermission: () => ({
    me: { id: 'emp-1', firstName: 'Ada', lastName: 'Lovelace' },
    can: (action: string, module: string) => action === 'VIEW' && module === 'MESSENGER',
  }),
}));

let activeHub: MessengerRealtimeHub | null = null;

vi.mock('@/features/messenger/realtime/MessengerRealtimeProvider', () => ({
  useMessengerRealtimeHub: () => {
    if (!activeHub) throw new Error('entity hub is not ready');
    return activeHub;
  },
}));

const CONVERSATION_ID = 'conv-entity';
const CONVERSATION: MessengerCoreConversationRow = {
  id: CONVERSATION_ID,
  zone: 'INTERNAL',
  type: 'PRODUCT',
  title: 'Product',
  status: 'ACTIVE',
  canonicalKey: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  lastMessageAt: '2026-10-01T12:00:00.000Z',
  canWrite: true,
};

type Emit = { event: string; payload: unknown; ack?: (response: unknown) => void };
type Listener = (...args: unknown[]) => void;
type EntityView = ReturnType<typeof useEntityConversation>;

describe('entity conversation access revoke', () => {
  let harness: ReturnType<typeof createHarness>;
  let queryClient: QueryClient;
  let mounted: { unmount: () => void; current: EntityView | null } | null = null;

  beforeEach(() => {
    vi.spyOn(messengerCoreApi, 'ensureProduct').mockResolvedValue(CONVERSATION);
    vi.spyOn(messengerCoreApi, 'listMessages').mockResolvedValue({
      items: [
        {
          id: 'm1',
          conversationId: CONVERSATION_ID,
          senderId: 'emp-1',
          senderName: 'Ada',
          content: 'hello',
          createdAt: '2026-10-01T12:00:00.000Z',
          editedAt: null,
          attachments: [],
        },
      ],
      meta: { hasMoreOlder: false },
    });
    vi.spyOn(messengerCoreApi, 'markRead').mockResolvedValue(undefined);
    vi.spyOn(messengerCoreApi, 'sendMessage').mockResolvedValue({} as never);
    const reactGlobals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    reactGlobals.IS_REACT_ACT_ENVIRONMENT = true;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    harness = createHarness();
    harness.hub.attachQueryClient(queryClient);
    activeHub = harness.hub;
    harness.hub.start('tok');
    harness.connect();
  });

  afterEach(() => {
    mounted?.unmount();
    mounted = null;
    harness.hub.stop();
    activeHub = null;
    vi.restoreAllMocks();
  });

  it('stops the subscription, disables send, and drops the cached thread', async () => {
    const view = mountEntity(queryClient);
    mounted = view;
    await waitFor(() => view.current?.messages.some((row) => row.id === 'm1') ?? false);
    ackSubscribes(harness.emits);
    await act(async () => {
      harness.fire(MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED, {
        conversationId: CONVERSATION_ID,
        zone: 'INTERNAL',
      });
    });
    await waitFor(() => view.current?.revoked === true);
    expect(view.current?.messages).toEqual([]);
    expect(queryClient.getQueryData(messengerQueryKeys.messages(CONVERSATION_ID))).toBeUndefined();
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_LEAVE_CONVERSATION)).toEqual([
      { conversationId: CONVERSATION_ID },
    ]);
    view.current?.send({});
    expect(messengerCoreApi.sendMessage).not.toHaveBeenCalled();
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION)).toHaveLength(
      1,
    );
  });
});

function createHarness() {
  const handlers = new Map<string, Listener[]>();
  const emits: Emit[] = [];
  const transport = createTransport(handlers, emits);
  const hub = new MessengerRealtimeHub({
    connect: () => transport.socket,
    recoverSession: async () => ({ kind: 'available', accessToken: 'tok' }),
    recoverZone: async () => undefined,
  });
  return { hub, emits, connect: transport.connect, fire: transport.fire };
}

function createTransport(handlers: Map<string, Listener[]>, emits: Emit[]) {
  let connected = false;
  const socket: MessengerClientSocket = {
    get connected() {
      return connected;
    },
    on(event, listener) {
      const list = handlers.get(event) ?? [];
      list.push(listener);
      handlers.set(event, list);
    },
    emit(event, ...args) {
      emits.push({ event, payload: args[0], ack: readAck(args[1]) });
    },
    close() {
      connected = false;
    },
    removeAllListeners() {
      handlers.clear();
    },
    io: { on() {} },
  };
  return {
    socket,
    connect() {
      connected = true;
      for (const listener of handlers.get('connect') ?? []) listener();
    },
    fire(event: string, payload: unknown) {
      for (const listener of handlers.get(event) ?? []) listener(payload);
    },
  };
}

function mountEntity(queryClient: QueryClient) {
  const container = document.createElement('div');
  const root = createRoot(container);
  const published: { current: EntityView | null } = { current: null };
  act(() => {
    root.render(createElement(QueryClientProvider, { client: queryClient }, createElement(Screen)));
  });
  return {
    get current() {
      return published.current;
    },
    unmount() {
      act(() => root.unmount());
    },
  };

  function Screen(): ReactNode {
    const state = useEntityConversation('product', 'product-1');
    useEffect(() => {
      published.current = state;
    });
    return null;
  }
}

async function waitFor(ready: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (ready()) return;
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10);
      });
    });
  }
  throw new Error('timed out waiting for the entity conversation');
}

function ackSubscribes(emits: Emit[]): void {
  for (const item of emits) {
    if (item.event === MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION) item.ack?.({ ok: true });
  }
}

function eventPayloads(emits: Emit[], event: string): unknown[] {
  return emits.filter((item) => item.event === event).map((item) => item.payload);
}

function readAck(value: unknown): ((response: unknown) => void) | undefined {
  return typeof value === 'function' ? (value as (response: unknown) => void) : undefined;
}
