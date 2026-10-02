'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { MessengerZone } from '@/features/messenger/query/messenger-query-keys';
import { applyPresenceIds } from './messenger-legacy-parse';
import type { MessengerConnectionState } from './messenger-realtime-hub';
import { useMessengerRealtimeHub } from './MessengerRealtimeProvider';

/**
 * Retains one conversation room on the shared socket.
 * The first consumer subscribes. The last release leaves.
 * Safe for Task discussion to call later without creating a socket.
 */
export function useMessengerConversationSubscription(conversationId: string | null): void {
  const hub = useMessengerRealtimeHub();
  useEffect(() => {
    if (!conversationId) return;
    return hub.retainConversation(conversationId);
  }, [hub, conversationId]);
}

export function useMessengerSurfaceBinding(input: {
  enabled: boolean;
  zone: MessengerZone;
  activeId: string | null;
  clearActive: () => void;
}): void {
  const hub = useMessengerRealtimeHub();
  const activeRef = useRef(input.activeId);
  const clearRef = useRef(input.clearActive);
  useLayoutEffect(() => {
    activeRef.current = input.activeId;
    clearRef.current = input.clearActive;
  });
  useEffect(() => {
    if (!input.enabled) return;
    return hub.registerSurface({
      zone: input.zone,
      getActiveId: () => activeRef.current,
      clearActive: () => clearRef.current(),
    });
  }, [hub, input.enabled, input.zone]);
}

export function useMessengerConnectionState(): MessengerConnectionState {
  const hub = useMessengerRealtimeHub();
  return useSyncExternalStore(hub.subscribeState, hub.getState, hub.getState);
}

/** Online employees from the shared socket presence snapshot. */
export function useMessengerPresenceIds(): ReadonlySet<string> {
  const hub = useMessengerRealtimeHub();
  const [ids, setIds] = useState<readonly string[]>([]);
  useEffect(() => {
    return hub.addLegacyListener({
      onPresenceSnapshot: (employeeIds) => setIds(employeeIds),
      onPresenceDelta: (employeeId, state) => {
        setIds((current) => applyPresenceIds(current, employeeId, state));
      },
    });
  }, [hub]);
  return useMemo(() => new Set(ids), [ids]);
}

/** Ephemeral Core typing emit. The composer throttles repeats. */
export function useMessengerConversationTyping(): (conversationId: string) => void {
  const hub = useMessengerRealtimeHub();
  return useCallback((conversationId: string) => hub.emitConversationTyping(conversationId), [hub]);
}
