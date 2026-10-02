'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { MessengerMessageRow } from '@/lib/api/messenger';
import { mapMessengerRowToView, type MessengerViewMessage } from './messenger-message-mapper';
import type { MessengerActiveView } from './messenger-active-view';
import type { MessengerWsChannelPeerReadPayload, MessengerWsDmPeerReadPayload } from '@nbos/shared';
import type { MessengerLegacyListener } from './realtime/messenger-legacy-socket';
import { useMessengerRealtimeHub } from './realtime/MessengerRealtimeProvider';

export interface MessengerRealtimeControls {
  emitChannelTyping: (channelId: string) => void;
  emitDmTyping: (recipientId: string) => void;
}

type MessengerRealtimeOptions = {
  canViewMessenger: boolean;
  meId: string | undefined;
  active: MessengerActiveView | null;
  onInboundChannelMessage: (channelId: string, msg: MessengerViewMessage) => void;
  onInboundDmMessage: (counterpartId: string, msg: MessengerViewMessage) => void;
  onRemoteTypingHint: (hint: string) => void;
  onPresenceSnapshot?: (employeeIds: readonly string[]) => void;
  onPresenceDelta?: (employeeId: string, state: 'online' | 'offline') => void;
  onReadListsInvalidate?: () => void;
  onDmPeerRead?: (payload: MessengerWsDmPeerReadPayload) => void;
  onChannelPeerRead?: (payload: MessengerWsChannelPeerReadPayload) => void;
};

/** Legacy channel/DM listeners on the shared socket. Does not call `io()`. */
export function useMessengerRealtime(options: MessengerRealtimeOptions): MessengerRealtimeControls {
  const hub = useMessengerRealtimeHub();
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });
  useLegacyListeners(hub, options.canViewMessenger, options.meId, optionsRef);
  useLegacyChannel(hub, options.canViewMessenger, options.meId, options.active);
  return useLegacyTypingControls(hub);
}

function useLegacyListeners(
  hub: ReturnType<typeof useMessengerRealtimeHub>,
  canViewMessenger: boolean,
  meId: string | undefined,
  optionsRef: { current: MessengerRealtimeOptions },
): void {
  useEffect(() => {
    if (!canViewMessenger || !meId) return;
    const release = hub.addLegacyListener(createLegacyListener(optionsRef));
    const clearPresence = optionsRef.current.onPresenceSnapshot;
    return () => {
      release();
      clearPresence?.([]);
    };
  }, [hub, canViewMessenger, meId, optionsRef]);
}

function useLegacyChannel(
  hub: ReturnType<typeof useMessengerRealtimeHub>,
  canViewMessenger: boolean,
  meId: string | undefined,
  active: MessengerActiveView | null,
): void {
  const channelId = active?.type === 'channel' ? active.id : null;
  useEffect(() => {
    if (!canViewMessenger || !meId) return;
    hub.setLegacyChannel(channelId);
    return () => hub.setLegacyChannel(null);
  }, [hub, canViewMessenger, meId, channelId]);
}

function useLegacyTypingControls(
  hub: ReturnType<typeof useMessengerRealtimeHub>,
): MessengerRealtimeControls {
  const emitChannelTyping = useCallback(
    (channelId: string) => hub.emitChannelTyping(channelId),
    [hub],
  );
  const emitDmTyping = useCallback((recipientId: string) => hub.emitDmTyping(recipientId), [hub]);
  return useMemo(() => ({ emitChannelTyping, emitDmTyping }), [emitChannelTyping, emitDmTyping]);
}

function createLegacyListener(optionsRef: {
  current: MessengerRealtimeOptions;
}): MessengerLegacyListener {
  return {
    onChannelMessage: (channelId, message) =>
      emitChannelMessage(optionsRef.current, channelId, message),
    onDmMessage: (counterpartId, message) =>
      emitDmMessage(optionsRef.current, counterpartId, message),
    onChannelTyping: (payload) => emitChannelTypingHint(optionsRef.current, payload),
    onDmTyping: (payload) => emitDmTypingHint(optionsRef.current, payload),
    onPresenceSnapshot: (employeeIds) => optionsRef.current.onPresenceSnapshot?.(employeeIds),
    onPresenceDelta: (employeeId, state) => optionsRef.current.onPresenceDelta?.(employeeId, state),
    onReadLists: () => optionsRef.current.onReadListsInvalidate?.(),
    onDmPeerRead: (payload) => optionsRef.current.onDmPeerRead?.(payload),
    onChannelPeerRead: (payload) => optionsRef.current.onChannelPeerRead?.(payload),
  };
}

function emitChannelMessage(
  options: MessengerRealtimeOptions,
  channelId: string,
  message: MessengerMessageRow,
): void {
  options.onInboundChannelMessage(channelId, mapMessengerRowToView(message));
}

function emitDmMessage(
  options: MessengerRealtimeOptions,
  counterpartId: string,
  message: MessengerMessageRow,
): void {
  options.onInboundDmMessage(counterpartId, mapMessengerRowToView(message));
}

function emitChannelTypingHint(
  options: MessengerRealtimeOptions,
  payload: { channelId: string; employeeId: string; label: string },
): void {
  if (!options.meId || payload.employeeId === options.meId) return;
  const active = options.active;
  if (active?.type === 'channel' && active.id === payload.channelId) {
    options.onRemoteTypingHint(`${payload.label} is typing…`);
  }
}

function emitDmTypingHint(
  options: MessengerRealtimeOptions,
  payload: { counterpartId: string; employeeId: string; label: string },
): void {
  if (!options.meId || payload.employeeId === options.meId) return;
  const active = options.active;
  if (active?.type === 'dm' && active.userId === payload.counterpartId) {
    options.onRemoteTypingHint(`${payload.label} is typing…`);
  }
}
