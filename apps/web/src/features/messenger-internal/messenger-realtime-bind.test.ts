import { describe, expect, it, vi } from 'vitest';
import {
  MESSENGER_WS_CLIENT_LEAVE_CONVERSATION,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_PEER_READ,
  MESSENGER_WS_SERVER_CONVERSATION_SUMMARY,
  MESSENGER_WS_SERVER_PRESENCE,
  MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT,
  MESSENGER_WS_SERVER_READ_UPDATED,
} from '@nbos/shared';
import {
  bindMessengerRealtimeSocket,
  emitConversationLeave,
  emitConversationSubscribe,
  type MessengerRealtimeSocket,
} from './messenger-realtime-bind';

function createSocket() {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  return {
    handlers,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      handlers.set(event, cb);
    }),
    emit: vi.fn(),
    close: vi.fn(),
  } as unknown as MessengerRealtimeSocket & {
    handlers: Map<string, (...args: unknown[]) => void>;
    emit: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };
}

describe('messenger realtime bind cleanup', () => {
  it('closes the socket on cleanup so Strict Mode remount does not keep the first session', () => {
    const socket = createSocket();
    const cleanup = bindMessengerRealtimeSocket(socket, {
      conversationIdRef: { current: 'c1' },
      onInboundRef: { current: vi.fn() },
      onSummaryRef: { current: undefined },
      onConversationReadRef: { current: undefined },
      onAccessChangedRef: { current: undefined },
      onReadRef: { current: undefined },
      onReconnectRef: { current: undefined },
    });
    cleanup();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it('leaves A then joins B when switching, and reconnect joins only B', () => {
    const socket = createSocket();
    const conversationIdRef = { current: 'A' };
    const onReconnect = vi.fn();
    bindMessengerRealtimeSocket(socket, {
      conversationIdRef,
      onInboundRef: { current: vi.fn() },
      onSummaryRef: { current: undefined },
      onConversationReadRef: { current: undefined },
      onAccessChangedRef: { current: undefined },
      onReadRef: { current: undefined },
      onReconnectRef: { current: onReconnect },
    });
    socket.handlers.get('connect')?.();
    emitConversationLeave(socket, 'A');
    conversationIdRef.current = 'B';
    emitConversationSubscribe(socket, 'B');
    socket.handlers.get('connect')?.();
    expect(socket.emit.mock.calls).toEqual([
      [MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION, { conversationId: 'A' }],
      [MESSENGER_WS_CLIENT_LEAVE_CONVERSATION, { conversationId: 'A' }],
      [MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION, { conversationId: 'B' }],
      [MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION, { conversationId: 'B' }],
    ]);
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed summary and thread payloads', () => {
    const socket = createSocket();
    const onInbound = vi.fn();
    const onSummary = vi.fn();
    bindMessengerRealtimeSocket(socket, {
      conversationIdRef: { current: null },
      onInboundRef: { current: onInbound },
      onSummaryRef: { current: onSummary },
      onConversationReadRef: { current: undefined },
      onAccessChangedRef: { current: undefined },
      onReadRef: { current: undefined },
      onReconnectRef: { current: undefined },
    });
    socket.handlers.get(MESSENGER_WS_SERVER_CONVERSATION_SUMMARY)?.({ conversationId: 'c1' });
    socket.handlers.get(MESSENGER_WS_SERVER_CONVERSATION_MESSAGE)?.({
      conversationId: 'c1',
      message: { id: 'm1', conversationId: 'other' },
    });
    expect(onSummary).not.toHaveBeenCalled();
    expect(onInbound).not.toHaveBeenCalled();
  });

  it('routes conversation-scoped read updates without treating them as list invalidation', () => {
    const socket = createSocket();
    const onRead = vi.fn();
    const onConversationRead = vi.fn();
    bindMessengerRealtimeSocket(socket, {
      conversationIdRef: { current: null },
      onInboundRef: { current: vi.fn() },
      onSummaryRef: { current: undefined },
      onConversationReadRef: { current: onConversationRead },
      onAccessChangedRef: { current: undefined },
      onReadRef: { current: onRead },
      onReconnectRef: { current: undefined },
    });
    socket.handlers.get(MESSENGER_WS_SERVER_READ_UPDATED)?.({
      scope: 'conversation',
      conversationId: 'c1',
      unreadCount: 0,
      zone: 'INTERNAL',
      lastReadAt: '2026-09-05T12:00:00.000Z',
    });
    expect(onConversationRead).toHaveBeenCalledTimes(1);
    expect(onRead).not.toHaveBeenCalled();
  });

  it('applies presence snapshots and deltas, then clears presence when the socket closes', () => {
    const socket = createSocket();
    const onSnapshot = vi.fn();
    const onDelta = vi.fn();
    const cleanup = bindMessengerRealtimeSocket(socket, {
      conversationIdRef: { current: null },
      onInboundRef: { current: vi.fn() },
      onPresenceSnapshotRef: { current: onSnapshot },
      onPresenceDeltaRef: { current: onDelta },
    });
    socket.handlers.get(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT)?.({ employeeIds: ['e1'] });
    socket.handlers.get(MESSENGER_WS_SERVER_PRESENCE)?.({ employeeId: 'e2', state: 'offline' });
    socket.handlers.get(MESSENGER_WS_SERVER_PRESENCE)?.({ employeeId: '', state: 'online' });
    cleanup();
    expect(onSnapshot).toHaveBeenNthCalledWith(1, ['e1']);
    expect(onSnapshot).toHaveBeenNthCalledWith(2, []);
    expect(onDelta).toHaveBeenCalledTimes(1);
    expect(onDelta).toHaveBeenCalledWith('e2', 'offline');
  });

  it('routes another participant read cursor and ignores a malformed payload', () => {
    const socket = createSocket();
    const onPeerRead = vi.fn();
    bindMessengerRealtimeSocket(socket, {
      conversationIdRef: { current: null },
      onInboundRef: { current: vi.fn() },
      onPeerReadRef: { current: onPeerRead },
    });
    socket.handlers.get(MESSENGER_WS_SERVER_CONVERSATION_PEER_READ)?.({
      conversationId: 'c1',
      readerId: 'e2',
      lastReadAt: '2026-09-29T10:00:00.000Z',
    });
    socket.handlers.get(MESSENGER_WS_SERVER_CONVERSATION_PEER_READ)?.({ conversationId: 'c1' });
    expect(onPeerRead).toHaveBeenCalledTimes(1);
    expect(onPeerRead).toHaveBeenCalledWith({
      conversationId: 'c1',
      readerId: 'e2',
      lastReadAt: '2026-09-29T10:00:00.000Z',
    });
  });
});
