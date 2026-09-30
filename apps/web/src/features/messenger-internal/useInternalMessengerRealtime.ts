'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MESSENGER_SOCKET_NAMESPACE, MESSENGER_TYPING_EMIT_MIN_MS } from '@nbos/shared';
import type {
  MessengerWsConversationAccessChangedPayload,
  MessengerWsConversationReadUpdatedPayload,
  MessengerWsConversationSummaryPayload,
} from '@nbos/shared';
import { recoverRealtimeSession } from '@/lib/auth/realtime-session';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { MESSENGER_REMOTE_TYPING_HINT_MS } from '@/features/messenger/messenger-typing-ui.constants';
import {
  bindMessengerRealtimeSocket,
  emitConversationLeave,
  emitConversationSubscribe,
  emitConversationTyping,
  type MessengerRealtimeBindRefs,
} from './messenger-realtime-bind';
import type { ConversationTypingPeer } from './messenger-conversation-typing';
import { useMessengerOnlineIds } from './use-messenger-online-ids';
import type { ConversationPeerRead } from './messenger-peer-read';

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
  onPeerRead?: (payload: ConversationPeerRead) => void;
};

export function useInternalMessengerRealtime(options: InternalMessengerRealtimeOptions): {
  onlineIds: ReadonlySet<string>;
  typingPeer: ConversationTypingPeer | null;
  emitConversationTyping: () => void;
} {
  const [token, setToken] = useState<string | null>(null);
  const [typingPeer, setTypingPeer] = useState<ConversationTypingPeer | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presence = useMessengerOnlineIds();
  const onTyping = useRef((peer: ConversationTypingPeer) => {
    setTypingPeer(peer);
    if (typingClearRef.current) clearTimeout(typingClearRef.current);
    typingClearRef.current = setTimeout(() => setTypingPeer(null), MESSENGER_REMOTE_TYPING_HINT_MS);
  });
  const refs = useRealtimeCallbackRefs(options, presence, onTyping);

  useRealtimeAccessToken(options.canViewMessenger, options.meId, setToken);
  useRealtimeSocketSession(options.canViewMessenger, options.meId, token, socketRef, refs);
  useActiveConversationRoom(socketRef, options.conversationId);

  const emitTyping = useCallback(() => {
    const conversationId = options.conversationId;
    if (!conversationId) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current < MESSENGER_TYPING_EMIT_MIN_MS) return;
    lastTypingEmitRef.current = now;
    emitConversationTyping(socketRef.current, conversationId);
  }, [options.conversationId]);

  const visibleTyping =
    typingPeer && typingPeer.conversationId === options.conversationId ? typingPeer : null;
  return {
    onlineIds: presence.onlineIds,
    typingPeer: visibleTyping,
    emitConversationTyping: emitTyping,
  };
}

function useRealtimeCallbackRefs(
  options: InternalMessengerRealtimeOptions,
  presence: ReturnType<typeof useMessengerOnlineIds>,
  onTyping: { current: (peer: ConversationTypingPeer) => void },
): MessengerRealtimeBindRefs {
  const conversationIdRef = useRef(options.conversationId);
  const meIdRef = useRef(options.meId);
  const onInboundRef = useRef(options.onInboundMessage);
  const onSummaryRef = useRef(options.onConversationSummary);
  const onConversationReadRef = useRef(options.onConversationRead);
  const onAccessChangedRef = useRef(options.onAccessChanged);
  const onReadRef = useRef(options.onReadListsInvalidate);
  const onReconnectRef = useRef(options.onReconnect);
  const onPeerReadRef = useRef(options.onPeerRead);
  useLayoutEffect(() => {
    conversationIdRef.current = options.conversationId;
    meIdRef.current = options.meId;
    onInboundRef.current = options.onInboundMessage;
    onSummaryRef.current = options.onConversationSummary;
    onConversationReadRef.current = options.onConversationRead;
    onAccessChangedRef.current = options.onAccessChanged;
    onReadRef.current = options.onReadListsInvalidate;
    onReconnectRef.current = options.onReconnect;
    onPeerReadRef.current = options.onPeerRead;
  });
  return useMemo(
    () => ({
      conversationIdRef,
      meIdRef,
      onInboundRef,
      onSummaryRef,
      onConversationReadRef,
      onAccessChangedRef,
      onReadRef,
      onReconnectRef,
      onPeerReadRef,
      onConversationTypingRef: onTyping,
      onPresenceSnapshotRef: presence.onPresenceSnapshotRef,
      onPresenceDeltaRef: presence.onPresenceDeltaRef,
    }),
    [
      conversationIdRef,
      meIdRef,
      onInboundRef,
      onSummaryRef,
      onConversationReadRef,
      onAccessChangedRef,
      onReadRef,
      onReconnectRef,
      onPeerReadRef,
      onTyping,
      presence.onPresenceDeltaRef,
      presence.onPresenceSnapshotRef,
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
