'use client';

import type { MessengerZone } from '@/features/messenger/query/messenger-query-keys';
import {
  useMessengerConversationSubscription,
  useMessengerSurfaceBinding,
} from '@/features/messenger/realtime/use-messenger-realtime';

export type InternalMessengerRealtimeOptions = {
  canViewMessenger: boolean;
  meId: string | undefined;
  zone: MessengerZone;
  conversationId: string | null;
  clearActive: () => void;
};

/** Subscribes the open thread to the shared runtime. Does not open a socket. */
export function useInternalMessengerRealtime(options: InternalMessengerRealtimeOptions): void {
  const enabled = options.canViewMessenger && Boolean(options.meId);
  useMessengerConversationSubscription(enabled ? options.conversationId : null);
  useMessengerSurfaceBinding({
    enabled,
    zone: options.zone,
    activeId: options.conversationId,
    clearActive: options.clearActive,
  });
}
