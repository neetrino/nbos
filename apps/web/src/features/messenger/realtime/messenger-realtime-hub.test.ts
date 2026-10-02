import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import {
  MESSENGER_WS_CLIENT_LEAVE_CONVERSATION,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT,
} from '@nbos/shared';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { MessengerRealtimeHub } from './messenger-realtime-hub';
import type { MessengerClientSocket } from './messenger-socket-client';

type Emit = { event: string; payload: unknown; ack?: (response: unknown) => void };

function createHarness() {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  const emits: Emit[] = [];
  const transport = createTransport(handlers, emits);
  const recoverZone = vi.fn(async () => undefined);
  const hub = new MessengerRealtimeHub({
    connect: () => transport.socket,
    recoverSession: async () => ({ kind: 'available', accessToken: 'tok' }),
    recoverZone,
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  hub.attachQueryClient(queryClient);
  return { hub, queryClient, recoverZone, emits, ...transport.controls };
}

function createTransport(
  handlers: Map<string, Array<(...args: unknown[]) => void>>,
  emits: Emit[],
) {
  let connected = false;
  const close = vi.fn(() => {
    connected = false;
  });
  const socket = createSocket(handlers, emits, close, () => connected);
  return {
    socket,
    controls: {
      close,
      connect() {
        connected = true;
        for (const listener of handlers.get('connect') ?? []) listener();
      },
      disconnect(reason: string) {
        connected = false;
        for (const listener of handlers.get('disconnect') ?? []) listener(reason);
      },
      fire(event: string, payload: unknown) {
        for (const listener of handlers.get(event) ?? []) listener(payload);
      },
    },
  };
}

function createSocket(
  handlers: Map<string, Array<(...args: unknown[]) => void>>,
  emits: Emit[],
  close: () => void,
  isConnected: () => boolean,
): MessengerClientSocket {
  return {
    get connected() {
      return isConnected();
    },
    on(event, listener) {
      const list = handlers.get(event) ?? [];
      list.push(listener);
      handlers.set(event, list);
    },
    emit(event, ...args) {
      const ack = readAck(args[1]);
      emits.push({ event, payload: args[0], ack });
    },
    close,
    removeAllListeners() {
      handlers.clear();
    },
    io: { on() {} },
  };
}

function readAck(value: unknown): ((response: unknown) => void) | undefined {
  return typeof value === 'function' ? (value as (response: unknown) => void) : undefined;
}

function subscribeEmits(emits: Emit[]): Emit[] {
  return emits.filter((item) => item.event === MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION);
}

function leaveEmits(emits: Emit[]): Emit[] {
  return emits.filter((item) => item.event === MESSENGER_WS_CLIENT_LEAVE_CONVERSATION);
}

function message(id: string): MessengerCoreMessageRow {
  return {
    id,
    conversationId: 'c1',
    senderId: 'e1',
    senderName: 'Ada',
    content: 'live',
    createdAt: '2026-09-05T12:00:00.000Z',
    editedAt: null,
    attachments: [],
  };
}

describe('messenger realtime hub', () => {
  it('subscribes a conversation that was retained before the socket connected', () => {
    const harness = createHarness();
    harness.hub.start('tok');
    harness.hub.retainConversation('early');
    expect(subscribeEmits(harness.emits)).toHaveLength(0);
    harness.connect();
    expect(subscribeEmits(harness.emits).map((item) => item.payload)).toEqual([
      { conversationId: 'early' },
    ]);
  });

  it('reference-counts one room and leaves only when the last consumer releases', () => {
    const harness = createHarness();
    harness.hub.start('tok');
    harness.connect();
    const first = harness.hub.retainConversation('c1');
    const second = harness.hub.retainConversation('c1');
    expect(subscribeEmits(harness.emits)).toHaveLength(1);
    subscribeEmits(harness.emits)[0]?.ack?.({ ok: true });
    first();
    expect(leaveEmits(harness.emits)).toHaveLength(0);
    second();
    expect(leaveEmits(harness.emits).map((item) => item.payload)).toEqual([
      { conversationId: 'c1' },
    ]);
    expect(harness.close).not.toHaveBeenCalled();
    harness.hub.stop();
    expect(harness.close).toHaveBeenCalledTimes(1);
  });

  it('joins a still-retained conversation after an early false ack once the socket is authorized', () => {
    const harness = createHarness();
    harness.hub.start('tok');
    harness.connect();
    const release = harness.hub.retainConversation('c1');
    subscribeEmits(harness.emits)[0]?.ack?.({ ok: false });
    expect(leaveEmits(harness.emits)).toHaveLength(0);
    expect(subscribeEmits(harness.emits)).toHaveLength(1);
    harness.fire(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT, { employeeIds: ['e1'] });
    expect(subscribeEmits(harness.emits)).toHaveLength(2);
    subscribeEmits(harness.emits)[1]?.ack?.({ ok: true });
    release();
    expect(leaveEmits(harness.emits).map((item) => item.payload)).toEqual([
      { conversationId: 'c1' },
    ]);
  });

  it('does not retry a denial that arrives after the socket is authorized', () => {
    const harness = createHarness();
    harness.hub.start('tok');
    harness.connect();
    harness.fire(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT, { employeeIds: ['e1'] });
    const release = harness.hub.retainConversation('c1');
    subscribeEmits(harness.emits)[0]?.ack?.({ ok: false });
    harness.fire(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT, { employeeIds: ['e1'] });
    expect(subscribeEmits(harness.emits)).toHaveLength(1);
    release();
    expect(leaveEmits(harness.emits)).toHaveLength(0);
  });

  it('does not leave after a false ack, and leaves on a late successful ack', () => {
    const denied = createHarness();
    denied.hub.start('tok');
    denied.connect();
    const releaseDenied = denied.hub.retainConversation('c1');
    subscribeEmits(denied.emits)[0]?.ack?.({ ok: false });
    releaseDenied();
    expect(leaveEmits(denied.emits)).toHaveLength(0);

    const late = createHarness();
    late.hub.start('tok');
    late.connect();
    const releaseLate = late.hub.retainConversation('c1');
    const ack = subscribeEmits(late.emits)[0]?.ack;
    releaseLate();
    expect(leaveEmits(late.emits)).toHaveLength(0);
    ack?.({ ok: true });
    expect(leaveEmits(late.emits).map((item) => item.payload)).toEqual([{ conversationId: 'c1' }]);
  });

  it('restores positive refcounts on reconnect without dropping cached messages', () => {
    const harness = createHarness();
    harness.queryClient.setQueryData(messengerQueryKeys.messages('c1'), {
      items: [message('kept')],
      meta: { hasMoreOlder: false },
    });
    harness.hub.start('tok');
    harness.connect();
    harness.hub.retainConversation('keep');
    const gone = harness.hub.retainConversation('gone');
    gone();
    expect(harness.recoverZone).not.toHaveBeenCalled();
    harness.disconnect('transport close');
    expect(harness.hub.getState()).toBe('reconnecting');
    expect(harness.queryClient.getQueryData(messengerQueryKeys.messages('c1'))).toEqual({
      items: [message('kept')],
      meta: { hasMoreOlder: false },
    });
    const before = subscribeEmits(harness.emits).length;
    harness.connect();
    const restored = subscribeEmits(harness.emits)
      .slice(before)
      .map((item) => (item.payload as { conversationId: string }).conversationId);
    expect(restored).toEqual(['keep']);
    expect(harness.recoverZone).toHaveBeenCalledWith(
      harness.queryClient,
      'INTERNAL',
      expect.objectContaining({ activeId: null }),
    );
    expect(harness.recoverZone).toHaveBeenCalledWith(
      harness.queryClient,
      'CLIENT',
      expect.objectContaining({ activeId: null }),
    );
  });

  it('applies a live message without zone recovery and clears a revoked open thread', () => {
    const harness = createHarness();
    harness.hub.start('tok');
    harness.connect();
    harness.queryClient.setQueryData(messengerQueryKeys.messages('c1'), {
      items: [],
      meta: { hasMoreOlder: false },
    });
    const clearActive = vi.fn();
    harness.hub.registerSurface({
      zone: 'INTERNAL',
      getActiveId: () => 'lost',
      clearActive,
    });
    harness.fire(MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: 'c1',
      message: message('m1'),
    });
    const thread = harness.queryClient.getQueryData<{ items: MessengerCoreMessageRow[] }>(
      messengerQueryKeys.messages('c1'),
    );
    expect(thread?.items.map((row) => row.id)).toEqual(['m1']);
    expect(harness.recoverZone).not.toHaveBeenCalled();
    harness.fire(MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED, {
      conversationId: 'lost',
      zone: 'INTERNAL',
    });
    expect(clearActive).toHaveBeenCalledTimes(1);
  });
});
