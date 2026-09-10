'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MESSENGER_SOCKET_NAMESPACE } from '@nbos/shared';
import type {
  MessengerWsConversationAccessChangedPayload,
  MessengerWsConversationReadUpdatedPayload,
  MessengerWsConversationSummaryPayload,
} from '@nbos/shared';
import { recoverRealtimeSession } from '@/lib/auth/realtime-session';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import {
  bindMessengerRealtimeSocket,
  emitConversationLeave,
  emitConversationSubscribe,
  type MessengerRealtimeBindRefs,
} from './messenger-realtime-bind';

const MESSENGER_SOCKET_DEV_ORIGIN = 'http://localhost:4000';

function messengerSocketOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return origin && origin.length > 0 ? origin : MESSENGER_SOCKET_DEV_ORIGIN;
}

export type InternalMessengerRealtimeOptions = {
  canViewMessenger: boolean;
  meId: string | undefined;
  conversationId: string | null;
  onInboundMessage: (conversationId: string, message: MessengerCoreMessageRow) => void;
  onConversationSummary?: (payload: MessengerWsConversationSummaryPayload) => void;
  onConversationRead?: (payload: MessengerWsConversationReadUpdatedPayload) => void;
  onAccessChanged?: (payload: MessengerWsConversationAccessChangedPayload) => void;
  onReconnect?: () => void;
  onReadListsInvalidate?: () => void;
};

export function useInternalMessengerRealtime(options: InternalMessengerRealtimeOptions): void {
  const [token, setToken] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const refs = useRealtimeCallbackRefs(options);

  useRealtimeAccessToken(options.canViewMessenger, options.meId, setToken);
  useRealtimeSocketSession(options.canViewMessenger, options.meId, token, socketRef, refs);
  useActiveConversationRoom(socketRef, options.conversationId);
}

function useRealtimeCallbackRefs(
  options: InternalMessengerRealtimeOptions,
): MessengerRealtimeBindRefs {
  const conversationIdRef = useRef(options.conversationId);
  const onInboundRef = useRef(options.onInboundMessage);
  const onSummaryRef = useRef(options.onConversationSummary);
  const onConversationReadRef = useRef(options.onConversationRead);
  const onAccessChangedRef = useRef(options.onAccessChanged);
  const onReadRef = useRef(options.onReadListsInvalidate);
  const onReconnectRef = useRef(options.onReconnect);
  useLayoutEffect(() => {
    conversationIdRef.current = options.conversationId;
    onInboundRef.current = options.onInboundMessage;
    onSummaryRef.current = options.onConversationSummary;
    onConversationReadRef.current = options.onConversationRead;
    onAccessChangedRef.current = options.onAccessChanged;
    onReadRef.current = options.onReadListsInvalidate;
    onReconnectRef.current = options.onReconnect;
  });
  return useMemo(
    () => ({
      conversationIdRef,
      onInboundRef,
      onSummaryRef,
      onConversationReadRef,
      onAccessChangedRef,
      onReadRef,
      onReconnectRef,
    }),
    [
      conversationIdRef,
      onInboundRef,
      onSummaryRef,
      onConversationReadRef,
      onAccessChangedRef,
      onReadRef,
      onReconnectRef,
    ],
  );
}

function useRealtimeAccessToken(
  canViewMessenger: boolean,
  meId: string | undefined,
  setToken: (token: string | null) => void,
): void {
  useEffect(() => {
    if (!canViewMessenger || !meId) {
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
  }, [canViewMessenger, meId, setToken]);
}

function useRealtimeSocketSession(
  canViewMessenger: boolean,
  meId: string | undefined,
  token: string | null,
  socketRef: { current: ReturnType<typeof io> | null },
  refs: MessengerRealtimeBindRefs,
): void {
  useEffect(() => {
    if (!canViewMessenger || !token || !meId) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }
    const socket = io(`${messengerSocketOrigin()}${MESSENGER_SOCKET_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    const unbind = bindMessengerRealtimeSocket(socket, refs);
    return () => {
      unbind();
      socketRef.current = null;
    };
  }, [canViewMessenger, meId, token, socketRef, refs]);
}

function useActiveConversationRoom(
  socketRef: { current: ReturnType<typeof io> | null },
  conversationId: string | null,
): void {
  useEffect(() => {
    const socket = socketRef.current;
    if (conversationId) emitConversationSubscribe(socket, conversationId);
    return () => {
      if (conversationId) emitConversationLeave(socket, conversationId);
    };
  }, [conversationId, socketRef]);
}
