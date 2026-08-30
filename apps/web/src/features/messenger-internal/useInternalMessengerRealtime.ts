'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  MESSENGER_SOCKET_NAMESPACE,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_READ_UPDATED_SCOPE,
  MESSENGER_WS_SERVER_READ_UPDATED,
} from '@nbos/shared';
import { recoverRealtimeSession } from '@/lib/auth/realtime-session';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

const MESSENGER_SOCKET_DEV_ORIGIN = 'http://localhost:4000';

function messengerSocketOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return origin && origin.length > 0 ? origin : MESSENGER_SOCKET_DEV_ORIGIN;
}

function isListReadPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  return (payload as { scope?: unknown }).scope === MESSENGER_WS_READ_UPDATED_SCOPE.LISTS;
}

export function useInternalMessengerRealtime(options: {
  canViewMessenger: boolean;
  meId: string | undefined;
  conversationId: string | null;
  onInboundMessage: (conversationId: string, message: MessengerCoreMessageRow) => void;
  onReadListsInvalidate?: () => void;
}): void {
  const [token, setToken] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const conversationIdRef = useRef(options.conversationId);
  const onInboundRef = useRef(options.onInboundMessage);
  const onReadRef = useRef(options.onReadListsInvalidate);

  useLayoutEffect(() => {
    conversationIdRef.current = options.conversationId;
    onInboundRef.current = options.onInboundMessage;
    onReadRef.current = options.onReadListsInvalidate;
  });

  useEffect(() => {
    if (!options.canViewMessenger || !options.meId) {
      queueMicrotask(() => setToken(null));
      return;
    }
    let cancelled = false;
    void recoverRealtimeSession().then((result) => {
      if (cancelled) return;
      setToken(result.kind === 'available' ? result.accessToken : null);
    });
    return () => {
      cancelled = true;
    };
  }, [options.canViewMessenger, options.meId]);

  useEffect(() => {
    if (!options.canViewMessenger || !token || !options.meId) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }
    const socket = io(`${messengerSocketOrigin()}${MESSENGER_SOCKET_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    function joinActive() {
      const id = conversationIdRef.current;
      if (id) socket.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION, { conversationId: id });
    }
    socket.on('connect', joinActive);
    socket.on(
      MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
      (payload: { conversationId: string; message: MessengerCoreMessageRow }) => {
        onInboundRef.current(payload.conversationId, payload.message);
      },
    );
    socket.on(MESSENGER_WS_SERVER_READ_UPDATED, (payload: unknown) => {
      if (isListReadPayload(payload)) onReadRef.current?.();
    });
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [options.canViewMessenger, options.meId, token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !options.conversationId) return;
    socket.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION, {
      conversationId: options.conversationId,
    });
  }, [options.conversationId]);
}
