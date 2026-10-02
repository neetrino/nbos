'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MESSENGER_TYPING_EMIT_MIN_MS } from '@nbos/shared';
import { MESSENGER_REMOTE_TYPING_HINT_MS } from '@/features/messenger/messenger-typing-ui.constants';
import type { MessengerZone } from '@/features/messenger/query/messenger-query-keys';
import { useMessengerRealtimeHub } from '@/features/messenger/realtime/MessengerRealtimeProvider';
import {
  useMessengerConversationSubscription,
  useMessengerConversationTyping,
  useMessengerPresenceIds,
  useMessengerSurfaceBinding,
} from '@/features/messenger/realtime/use-messenger-realtime';
import type { ConversationTypingPeer } from './messenger-conversation-typing';

export type InternalMessengerRealtimeOptions = {
  canViewMessenger: boolean;
  meId: string | undefined;
  zone: MessengerZone;
  conversationId: string | null;
  clearActive: () => void;
};

/** Subscribes the open thread to the shared runtime. Does not open a socket. */
export function useInternalMessengerRealtime(options: InternalMessengerRealtimeOptions): {
  onlineIds: ReadonlySet<string>;
  typingPeer: ConversationTypingPeer | null;
  emitConversationTyping: () => void;
} {
  const enabled = options.canViewMessenger && Boolean(options.meId);
  useMessengerConversationSubscription(enabled ? options.conversationId : null);
  useMessengerSurfaceBinding({
    enabled,
    zone: options.zone,
    activeId: options.conversationId,
    clearActive: options.clearActive,
  });
  return {
    onlineIds: useMessengerPresenceIds(),
    typingPeer: useVisibleTypingPeer(options.conversationId, options.meId),
    emitConversationTyping: useThrottledConversationTyping(options.conversationId),
  };
}

function useVisibleTypingPeer(
  conversationId: string | null,
  meId: string | undefined,
): ConversationTypingPeer | null {
  const hub = useMessengerRealtimeHub();
  const [peer, setPeer] = useState<ConversationTypingPeer | null>(null);
  useEffect(() => {
    return hub.subscribeConversationTyping((next) => {
      if (next.employeeId === meId) return;
      if (next.conversationId !== conversationId) return;
      setPeer(next);
    });
  }, [conversationId, hub, meId]);
  useEffect(() => {
    if (!peer) return;
    const timer = setTimeout(() => setPeer(null), MESSENGER_REMOTE_TYPING_HINT_MS);
    return () => clearTimeout(timer);
  }, [peer]);
  if (!peer || peer.conversationId !== conversationId) return null;
  return peer;
}

function useThrottledConversationTyping(conversationId: string | null): () => void {
  const emitTyping = useMessengerConversationTyping();
  const lastEmitRef = useRef(0);
  return useCallback(() => {
    if (!conversationId) return;
    const now = Date.now();
    if (now - lastEmitRef.current < MESSENGER_TYPING_EMIT_MIN_MS) return;
    lastEmitRef.current = now;
    emitTyping(conversationId);
  }, [conversationId, emitTyping]);
}
