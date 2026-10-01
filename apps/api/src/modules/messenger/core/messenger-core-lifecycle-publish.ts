import { MESSENGER_WS_READ_UPDATED_SCOPE, type MessengerWsZone } from '@nbos/shared';

type ReadPublisher = {
  emitConversationReadUpdated: (
    employeeId: string,
    payload: {
      scope: typeof MESSENGER_WS_READ_UPDATED_SCOPE.CONVERSATION;
      conversationId: string;
      unreadCount: number;
      zone: MessengerWsZone;
      lastReadAt: string;
    },
  ) => void;
  emitConversationPeerRead: (
    conversationId: string,
    payload: { conversationId: string; readerId: string; lastReadAt: string },
  ) => void;
};

type FavoritePublisher = {
  emitConversationFavorite: (
    employeeId: string,
    payload: { conversationId: string; zone: MessengerWsZone; favorite: boolean },
  ) => void;
};

/** Both emits run only after the read transaction has committed. */
export function publishCommittedRead(
  gateway: ReadPublisher,
  employeeId: string,
  zone: MessengerWsZone,
  conversationId: string,
  lastReadAt: Date,
): void {
  const readAt = lastReadAt.toISOString();
  gateway.emitConversationReadUpdated(employeeId, {
    scope: MESSENGER_WS_READ_UPDATED_SCOPE.CONVERSATION,
    conversationId,
    unreadCount: 0,
    zone,
    lastReadAt: readAt,
  });
  gateway.emitConversationPeerRead(conversationId, {
    conversationId,
    readerId: employeeId,
    lastReadAt: readAt,
  });
}

export function requireMessengerGateway<T>(gateway: T | undefined): T {
  if (!gateway) throw new Error('Messenger gateway is unavailable');
  return gateway;
}

/** Absolute favorite flag. Call only after the favorite transaction commits. */
export function publishCommittedFavorite(
  gateway: FavoritePublisher,
  employeeId: string,
  zone: MessengerWsZone,
  conversationId: string,
  favorite: boolean,
): void {
  gateway.emitConversationFavorite(employeeId, { conversationId, zone, favorite });
}
