import type { Socket } from 'socket.io-client';
import {
  MESSENGER_WS_CLIENT_LEAVE_CONVERSATION,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_PEER_READ,
  MESSENGER_WS_SERVER_CONVERSATION_SUMMARY,
  MESSENGER_WS_SERVER_PRESENCE,
  MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT,
  MESSENGER_WS_SERVER_READ_UPDATED,
  type MessengerWsConversationAccessChangedPayload,
  type MessengerWsConversationReadUpdatedPayload,
  type MessengerWsConversationSummaryPayload,
} from '@nbos/shared';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { isMessengerListReadPayload } from './messenger-realtime-list-read';
import { parseConversationPeerRead, type ConversationPeerRead } from './messenger-peer-read';
import {
  parsePresenceDelta,
  parsePresenceSnapshot,
  type MessengerPresenceState,
} from './messenger-presence-payload';
import {
  isConversationAccessChangedPayload,
  isConversationReadPayload,
  isConversationSummaryPayload,
  isCoreConversationMessagePayload,
} from '@/features/messenger/query/messenger-realtime-payload';

export type MessengerRealtimeSocket = Pick<Socket, 'on' | 'close' | 'emit'>;

export type MessengerRealtimeBindRefs = {
  conversationIdRef: { current: string | null };
  onInboundRef: { current: (conversationId: string, message: MessengerCoreMessageRow) => void };
  onSummaryRef: { current?: (payload: MessengerWsConversationSummaryPayload) => void };
  onConversationReadRef: {
    current?: (payload: MessengerWsConversationReadUpdatedPayload) => void;
  };
  onAccessChangedRef: {
    current?: (payload: MessengerWsConversationAccessChangedPayload) => void;
  };
  onReadRef: { current?: () => void };
  onReconnectRef: { current?: () => void };
  onPresenceSnapshotRef?: { current?: (employeeIds: readonly string[]) => void };
  onPresenceDeltaRef?: { current?: (employeeId: string, state: MessengerPresenceState) => void };
  onPeerReadRef?: { current?: (payload: ConversationPeerRead) => void };
};

export function bindMessengerRealtimeSocket(
  socket: MessengerRealtimeSocket,
  refs: MessengerRealtimeBindRefs,
): () => void {
  let hasConnected = false;
  socket.on('connect', () => {
    joinActiveConversation(socket, refs.conversationIdRef.current);
    if (hasConnected) refs.onReconnectRef.current?.();
    hasConnected = true;
  });
  bindCoreRealtimeListeners(socket, refs);
  bindPresenceListeners(socket, refs);
  return () => {
    refs.onPresenceSnapshotRef?.current?.([]);
    socket.close();
  };
}

export function emitConversationSubscribe(
  socket: Pick<MessengerRealtimeSocket, 'emit'> | null,
  conversationId: string,
): void {
  if (!socket) return;
  socket.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION, { conversationId });
}

export function emitConversationLeave(
  socket: Pick<MessengerRealtimeSocket, 'emit'> | null,
  conversationId: string,
): void {
  if (!socket) return;
  socket.emit(MESSENGER_WS_CLIENT_LEAVE_CONVERSATION, { conversationId });
}

function joinActiveConversation(
  socket: MessengerRealtimeSocket,
  conversationId: string | null,
): void {
  if (conversationId) emitConversationSubscribe(socket, conversationId);
}

function bindPresenceListeners(
  socket: MessengerRealtimeSocket,
  refs: MessengerRealtimeBindRefs,
): void {
  socket.on(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT, (payload: unknown) => {
    const employeeIds = parsePresenceSnapshot(payload);
    if (employeeIds) refs.onPresenceSnapshotRef?.current?.(employeeIds);
  });
  socket.on(MESSENGER_WS_SERVER_PRESENCE, (payload: unknown) => {
    const delta = parsePresenceDelta(payload);
    if (delta) refs.onPresenceDeltaRef?.current?.(delta.employeeId, delta.state);
  });
}

function bindCoreRealtimeListeners(
  socket: MessengerRealtimeSocket,
  refs: MessengerRealtimeBindRefs,
): void {
  socket.on(MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, (payload: unknown) => {
    if (!isCoreConversationMessagePayload(payload)) return;
    refs.onInboundRef.current(payload.conversationId, payload.message);
  });
  socket.on(MESSENGER_WS_SERVER_CONVERSATION_SUMMARY, (payload: unknown) => {
    if (!isConversationSummaryPayload(payload)) return;
    refs.onSummaryRef.current?.(payload);
  });
  socket.on(MESSENGER_WS_SERVER_READ_UPDATED, (payload: unknown) => {
    if (isConversationReadPayload(payload)) {
      refs.onConversationReadRef.current?.(payload);
      return;
    }
    if (isMessengerListReadPayload(payload)) refs.onReadRef.current?.();
  });
  socket.on(MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED, (payload: unknown) => {
    if (!isConversationAccessChangedPayload(payload)) return;
    refs.onAccessChangedRef.current?.(payload);
  });
  socket.on(MESSENGER_WS_SERVER_CONVERSATION_PEER_READ, (payload: unknown) => {
    const parsed = parseConversationPeerRead(payload);
    if (parsed) refs.onPeerReadRef?.current?.(parsed);
  });
}

export { isMessengerListReadPayload } from './messenger-realtime-list-read';
