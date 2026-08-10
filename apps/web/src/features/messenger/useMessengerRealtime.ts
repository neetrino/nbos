'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  MESSENGER_SOCKET_NAMESPACE,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
  MESSENGER_WS_CLIENT_TYPING_CONVERSATION,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_PEER_READ,
  MESSENGER_WS_SERVER_CONVERSATION_TYPING,
  MESSENGER_WS_READ_UPDATED_SCOPE,
  MESSENGER_WS_SERVER_PRESENCE,
  MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT,
  MESSENGER_WS_SERVER_READ_UPDATED,
  type MessengerWsConversationPeerReadPayload,
} from '@nbos/shared';
import type { MessengerUnifiedMessageRow } from '@/lib/api/messenger';
import type { MessengerViewMessage } from './messenger-message-mapper';
import { mapUnifiedMessageToView } from './messenger-unified-message.mapper';
import type { MessengerActiveView } from './messenger-active-view';

const MESSENGER_SOCKET_DEV_ORIGIN = 'http://localhost:4000';

function messengerSocketOrigin(): string {
  const o = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return o && o.length > 0 ? o : MESSENGER_SOCKET_DEV_ORIGIN;
}

function parsePresenceSnapshot(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const raw = (payload as { employeeIds?: unknown }).employeeIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

function parsePresenceDelta(
  payload: unknown,
): { employeeId: string; state: 'online' | 'offline' } | null {
  if (!payload || typeof payload !== 'object') return null;
  const e = (payload as { employeeId?: unknown }).employeeId;
  const s = (payload as { state?: unknown }).state;
  if (typeof e !== 'string' || e.trim().length === 0) return null;
  if (s !== 'online' && s !== 'offline') return null;
  return { employeeId: e, state: s };
}

function isMessengerReadListsPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  return (payload as { scope?: unknown }).scope === MESSENGER_WS_READ_UPDATED_SCOPE.LISTS;
}

function parseConversationPeerRead(
  payload: unknown,
): MessengerWsConversationPeerReadPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const conversationId = (payload as { conversationId?: unknown }).conversationId;
  const readerId = (payload as { readerId?: unknown }).readerId;
  const lastReadAt = (payload as { lastReadAt?: unknown }).lastReadAt;
  if (typeof conversationId !== 'string' || conversationId.trim().length === 0) return null;
  if (typeof readerId !== 'string' || readerId.trim().length === 0) return null;
  if (typeof lastReadAt !== 'string' || lastReadAt.trim().length === 0) return null;
  return { conversationId, readerId, lastReadAt };
}

export interface MessengerRealtimeControls {
  emitConversationTyping: (conversationId: string) => void;
}

export function useMessengerRealtime(options: {
  canViewMessenger: boolean;
  meId: string | undefined;
  active: MessengerActiveView | null;
  onInboundConversationMessage: (conversationId: string, msg: MessengerViewMessage) => void;
  onRemoteTypingHint: (hint: string) => void;
  onPresenceSnapshot?: (employeeIds: readonly string[]) => void;
  onPresenceDelta?: (employeeId: string, state: 'online' | 'offline') => void;
  onReadListsInvalidate?: () => void;
  onConversationPeerRead?: (payload: MessengerWsConversationPeerReadPayload) => void;
}): MessengerRealtimeControls {
  const [realtimeToken, setRealtimeToken] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeRef = useRef(options.active);
  const meIdRef = useRef(options.meId);
  const onMsg = useRef(options.onInboundConversationMessage);
  const onTypingHint = useRef(options.onRemoteTypingHint);
  const onPresenceSnapshotRef = useRef(options.onPresenceSnapshot);
  const onPresenceDeltaRef = useRef(options.onPresenceDelta);
  const onReadListsInvalidateRef = useRef(options.onReadListsInvalidate);
  const onPeerReadRef = useRef(options.onConversationPeerRead);

  useLayoutEffect(() => {
    activeRef.current = options.active;
    meIdRef.current = options.meId;
    onMsg.current = options.onInboundConversationMessage;
    onTypingHint.current = options.onRemoteTypingHint;
    onPresenceSnapshotRef.current = options.onPresenceSnapshot;
    onPresenceDeltaRef.current = options.onPresenceDelta;
    onReadListsInvalidateRef.current = options.onReadListsInvalidate;
    onPeerReadRef.current = options.onConversationPeerRead;
  });

  const emitConversationTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit(MESSENGER_WS_CLIENT_TYPING_CONVERSATION, { conversationId });
  }, []);

  useEffect(() => {
    if (!options.canViewMessenger || !options.meId) {
      queueMicrotask(() => setRealtimeToken(null));
      return;
    }

    let cancelled = false;

    async function loadRealtimeToken() {
      try {
        const res = await fetch('/api/auth/realtime-token');
        if (!res.ok) {
          if (!cancelled) setRealtimeToken(null);
          return;
        }
        const body = (await res.json()) as { token?: string };
        if (!cancelled) {
          setRealtimeToken(typeof body.token === 'string' ? body.token : null);
        }
      } catch {
        if (!cancelled) setRealtimeToken(null);
      }
    }

    void loadRealtimeToken();
    return () => {
      cancelled = true;
    };
  }, [options.canViewMessenger, options.meId]);

  useEffect(() => {
    if (!options.canViewMessenger || !realtimeToken || !options.meId) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    const socket = io(`${messengerSocketOrigin()}${MESSENGER_SOCKET_NAMESPACE}`, {
      auth: { token: realtimeToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    function subscribeIfConversation() {
      const a = activeRef.current;
      if (a?.type === 'conversation') {
        socket.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION, { conversationId: a.id });
      }
    }

    socket.on('connect', subscribeIfConversation);

    socket.on(
      MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
      (payload: { conversationId: string; message: MessengerUnifiedMessageRow }) => {
        onMsg.current(payload.conversationId, mapUnifiedMessageToView(payload.message));
      },
    );

    socket.on(
      MESSENGER_WS_SERVER_CONVERSATION_TYPING,
      (payload: { conversationId: string; employeeId: string; label: string }) => {
        const me = meIdRef.current;
        if (!me || payload.employeeId === me) return;
        const a = activeRef.current;
        if (a?.type === 'conversation' && a.id === payload.conversationId) {
          onTypingHint.current(`${payload.label} is typing…`);
        }
      },
    );

    socket.on(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT, (payload: unknown) => {
      onPresenceSnapshotRef.current?.(parsePresenceSnapshot(payload));
    });

    socket.on(MESSENGER_WS_SERVER_PRESENCE, (payload: unknown) => {
      const p = parsePresenceDelta(payload);
      if (p) onPresenceDeltaRef.current?.(p.employeeId, p.state);
    });

    socket.on(MESSENGER_WS_SERVER_READ_UPDATED, (payload: unknown) => {
      if (!isMessengerReadListsPayload(payload)) return;
      onReadListsInvalidateRef.current?.();
    });

    socket.on(MESSENGER_WS_SERVER_CONVERSATION_PEER_READ, (payload: unknown) => {
      const p = parseConversationPeerRead(payload);
      if (p) onPeerReadRef.current?.(p);
    });

    return () => {
      onPresenceSnapshotRef.current?.([]);
      socket.removeAllListeners();
      socket.close();
      socketRef.current = null;
    };
  }, [options.canViewMessenger, realtimeToken, options.meId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    if (options.active?.type === 'conversation') {
      socket.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION, {
        conversationId: options.active.id,
      });
    }
  }, [options.active]);

  return useMemo(
    () => ({
      emitConversationTyping,
    }),
    [emitConversationTyping],
  );
}
