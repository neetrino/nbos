'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, type Socket } from 'socket.io-client';
import {
  MESSENGER_SOCKET_NAMESPACE,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL,
  MESSENGER_WS_CLIENT_TYPING_CHANNEL,
  MESSENGER_WS_CLIENT_TYPING_DM,
  MESSENGER_WS_SERVER_CHANNEL_MESSAGE,
  MESSENGER_WS_SERVER_CHANNEL_TYPING,
  MESSENGER_WS_READ_UPDATED_SCOPE,
  MESSENGER_WS_SERVER_DM_MESSAGE,
  MESSENGER_WS_SERVER_DM_PEER_READ,
  MESSENGER_WS_SERVER_DM_TYPING,
  MESSENGER_WS_SERVER_PRESENCE,
  MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT,
  MESSENGER_WS_SERVER_READ_UPDATED,
  type MessengerWsDmPeerReadPayload,
} from '@nbos/shared';
import type { MessengerMessageRow } from '@/lib/api/messenger';
import { mapMessengerRowToView, type MessengerViewMessage } from './messenger-message-mapper';
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

function parseMessengerDmPeerReadPayload(payload: unknown): MessengerWsDmPeerReadPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const counterpartId = (payload as { counterpartId?: unknown }).counterpartId;
  const threadId = (payload as { threadId?: unknown }).threadId;
  const lastReadAt = (payload as { lastReadAt?: unknown }).lastReadAt;
  if (typeof counterpartId !== 'string' || counterpartId.trim().length === 0) return null;
  if (typeof threadId !== 'string' || threadId.trim().length === 0) return null;
  if (typeof lastReadAt !== 'string' || lastReadAt.trim().length === 0) return null;
  return { counterpartId, threadId, lastReadAt };
}

export interface MessengerRealtimeControls {
  emitChannelTyping: (channelId: string) => void;
  emitDmTyping: (recipientId: string) => void;
}

export function useMessengerRealtime(options: {
  canViewMessenger: boolean;
  meId: string | undefined;
  active: MessengerActiveView | null;
  onInboundChannelMessage: (channelId: string, msg: MessengerViewMessage) => void;
  onInboundDmMessage: (counterpartId: string, msg: MessengerViewMessage) => void;
  onRemoteTypingHint: (hint: string) => void;
  onPresenceSnapshot?: (employeeIds: readonly string[]) => void;
  onPresenceDelta?: (employeeId: string, state: 'online' | 'offline') => void;
  /** Fired when this user’s read cursors changed on another tab/device (re-fetch list unread). */
  onReadListsInvalidate?: () => void;
  /** DM peer advanced their read cursor (receipts on your own messages). */
  onDmPeerRead?: (payload: MessengerWsDmPeerReadPayload) => void;
}): MessengerRealtimeControls {
  const { data: session } = useSession();
  const accessToken = session?.accessToken ?? null;
  const socketRef = useRef<Socket | null>(null);
  const activeRef = useRef(options.active);
  const meIdRef = useRef(options.meId);
  const onCh = useRef(options.onInboundChannelMessage);
  const onDm = useRef(options.onInboundDmMessage);
  const onTypingHint = useRef(options.onRemoteTypingHint);
  const onPresenceSnapshotRef = useRef(options.onPresenceSnapshot);
  const onPresenceDeltaRef = useRef(options.onPresenceDelta);
  const onReadListsInvalidateRef = useRef(options.onReadListsInvalidate);
  const onDmPeerReadRef = useRef(options.onDmPeerRead);

  useLayoutEffect(() => {
    activeRef.current = options.active;
    meIdRef.current = options.meId;
    onCh.current = options.onInboundChannelMessage;
    onDm.current = options.onInboundDmMessage;
    onTypingHint.current = options.onRemoteTypingHint;
    onPresenceSnapshotRef.current = options.onPresenceSnapshot;
    onPresenceDeltaRef.current = options.onPresenceDelta;
    onReadListsInvalidateRef.current = options.onReadListsInvalidate;
    onDmPeerReadRef.current = options.onDmPeerRead;
  });

  const emitChannelTyping = useCallback((channelId: string) => {
    socketRef.current?.emit(MESSENGER_WS_CLIENT_TYPING_CHANNEL, { channelId });
  }, []);

  const emitDmTyping = useCallback((recipientId: string) => {
    socketRef.current?.emit(MESSENGER_WS_CLIENT_TYPING_DM, { recipientId });
  }, []);

  useEffect(() => {
    if (!options.canViewMessenger || !accessToken || !options.meId) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    const socket = io(`${messengerSocketOrigin()}${MESSENGER_SOCKET_NAMESPACE}`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    function subscribeIfChannel() {
      const a = activeRef.current;
      if (a?.type === 'channel') {
        socket.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL, { channelId: a.id });
      }
    }

    socket.on('connect', subscribeIfChannel);

    socket.on(
      MESSENGER_WS_SERVER_CHANNEL_MESSAGE,
      (payload: { channelId: string; message: MessengerMessageRow }) => {
        const view = mapMessengerRowToView(payload.message);
        onCh.current(payload.channelId, view);
      },
    );

    socket.on(
      MESSENGER_WS_SERVER_DM_MESSAGE,
      (payload: { counterpartId: string; message: MessengerMessageRow }) => {
        const view = mapMessengerRowToView(payload.message);
        onDm.current(payload.counterpartId, view);
      },
    );

    socket.on(
      MESSENGER_WS_SERVER_CHANNEL_TYPING,
      (payload: { channelId: string; employeeId: string; label: string }) => {
        const me = meIdRef.current;
        if (!me || payload.employeeId === me) return;
        const a = activeRef.current;
        if (a?.type === 'channel' && a.id === payload.channelId) {
          onTypingHint.current(`${payload.label} is typing…`);
        }
      },
    );

    socket.on(
      MESSENGER_WS_SERVER_DM_TYPING,
      (payload: { counterpartId: string; employeeId: string; label: string }) => {
        const me = meIdRef.current;
        if (!me || payload.employeeId === me) return;
        const a = activeRef.current;
        if (a?.type === 'dm' && a.userId === payload.counterpartId) {
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

    socket.on(MESSENGER_WS_SERVER_DM_PEER_READ, (payload: unknown) => {
      const p = parseMessengerDmPeerReadPayload(payload);
      if (p) onDmPeerReadRef.current?.(p);
    });

    return () => {
      onPresenceSnapshotRef.current?.([]);
      socket.removeAllListeners();
      socket.close();
      socketRef.current = null;
    };
  }, [options.canViewMessenger, accessToken, options.meId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    if (options.active?.type === 'channel') {
      socket.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL, { channelId: options.active.id });
    }
  }, [options.active]);

  return useMemo(
    () => ({
      emitChannelTyping,
      emitDmTyping,
    }),
    [emitChannelTyping, emitDmTyping],
  );
}
