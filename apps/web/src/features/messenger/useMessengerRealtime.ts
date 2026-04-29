'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, type Socket } from 'socket.io-client';
import {
  MESSENGER_SOCKET_NAMESPACE,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL,
  MESSENGER_WS_SERVER_CHANNEL_MESSAGE,
  MESSENGER_WS_SERVER_DM_MESSAGE,
} from '@nbos/shared';
import type { MessengerMessageRow } from '@/lib/api/messenger';
import { mapMessengerRowToView, type MessengerViewMessage } from './messenger-message-mapper';
import type { MessengerActiveView } from './messenger-active-view';

const MESSENGER_SOCKET_DEV_ORIGIN = 'http://localhost:4000';

function messengerSocketOrigin(): string {
  const o = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return o && o.length > 0 ? o : MESSENGER_SOCKET_DEV_ORIGIN;
}

export function useMessengerRealtime(options: {
  canViewMessenger: boolean;
  meId: string | undefined;
  active: MessengerActiveView | null;
  onInboundChannelMessage: (channelId: string, msg: MessengerViewMessage) => void;
  onInboundDmMessage: (counterpartId: string, msg: MessengerViewMessage) => void;
  onDmSidebarRefresh: () => void;
}): void {
  const { data: session } = useSession();
  const accessToken = session?.accessToken ?? null;
  const socketRef = useRef<Socket | null>(null);
  const activeRef = useRef(options.active);
  const onCh = useRef(options.onInboundChannelMessage);
  const onDm = useRef(options.onInboundDmMessage);
  const onSidebar = useRef(options.onDmSidebarRefresh);

  useLayoutEffect(() => {
    activeRef.current = options.active;
    onCh.current = options.onInboundChannelMessage;
    onDm.current = options.onInboundDmMessage;
    onSidebar.current = options.onDmSidebarRefresh;
  });

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
        onSidebar.current();
      },
    );

    return () => {
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
}
