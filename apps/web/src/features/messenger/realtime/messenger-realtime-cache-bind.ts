import {
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_FAVORITE,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_PEER_READ,
  MESSENGER_WS_SERVER_CONVERSATION_SUMMARY,
  MESSENGER_WS_SERVER_READ_UPDATED,
  type MessengerWsConversationAccessChangedPayload,
} from '@nbos/shared';
import type { QueryClient } from '@tanstack/react-query';
import {
  applyMessengerRealtimeMessage,
  invalidateMessengerSummaries,
  patchConversationFavorite,
  type MessengerMessagesPage,
} from '../query/messenger-cache';
import { applyPeerReadToMessages } from '../query/messenger-peer-read';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import {
  isConversationAccessChangedPayload,
  isConversationFavoritePayload,
  isConversationPeerReadPayload,
  isConversationReadPayload,
  isConversationSummaryPayload,
  isCoreConversationMessagePayload,
} from '../query/messenger-realtime-payload';
import {
  applyMessengerAccessChanged,
  applyMessengerRealtimeRead,
  applyMessengerRealtimeSummary,
} from '../query/messenger-realtime-cache';
import { isMessengerListReadPayload } from '@/features/messenger-internal/messenger-realtime-list-read';
import { invalidateOpenTicketSourcesForCanonicalMessage } from '@/features/support/components/ticket-source-query';

/**
 * Applies Core socket events to the root QueryClient.
 * Message payloads have no zone; the existing reducer keys by conversationId.
 * Summary, read, and access use the payload zone.
 * Returns an access payload when open surfaces must clear a revoked thread.
 */
export function applyMessengerCoreSocketEvent(
  queryClient: QueryClient,
  event: string,
  payload: unknown,
): MessengerWsConversationAccessChangedPayload | null {
  if (event === MESSENGER_WS_SERVER_CONVERSATION_MESSAGE) {
    applyCoreMessage(queryClient, payload);
    return null;
  }
  if (event === MESSENGER_WS_SERVER_CONVERSATION_SUMMARY) {
    applyCoreSummary(queryClient, payload);
    return null;
  }
  if (event === MESSENGER_WS_SERVER_READ_UPDATED) {
    applyCoreRead(queryClient, payload);
    return null;
  }
  if (event === MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED) {
    return applyCoreAccess(queryClient, payload);
  }
  if (event === MESSENGER_WS_SERVER_CONVERSATION_FAVORITE) {
    applyCoreFavorite(queryClient, payload);
    return null;
  }
  if (event === MESSENGER_WS_SERVER_CONVERSATION_PEER_READ) {
    applyCorePeerRead(queryClient, payload);
    return null;
  }
  return null;
}

function applyCoreMessage(queryClient: QueryClient, payload: unknown): void {
  if (!isCoreConversationMessagePayload(payload)) return;
  applyMessengerRealtimeMessage(queryClient, payload.message);
  invalidateOpenTicketSourcesForCanonicalMessage(queryClient, {
    id: payload.message.id,
    conversationId: payload.message.conversationId,
  });
}

function applyCoreSummary(queryClient: QueryClient, payload: unknown): void {
  if (!isConversationSummaryPayload(payload)) return;
  applyMessengerRealtimeSummary(queryClient, payload.zone, payload);
}

function applyCoreRead(queryClient: QueryClient, payload: unknown): void {
  if (isConversationReadPayload(payload)) {
    applyMessengerRealtimeRead(queryClient, payload.zone, payload);
    return;
  }
  if (!isMessengerListReadPayload(payload)) return;
  invalidateMessengerSummaries(queryClient, 'INTERNAL');
  invalidateMessengerSummaries(queryClient, 'CLIENT');
}

function applyCoreFavorite(queryClient: QueryClient, payload: unknown): void {
  if (!isConversationFavoritePayload(payload)) return;
  patchConversationFavorite(queryClient, payload.zone, payload.conversationId, payload.favorite);
}

function applyCorePeerRead(queryClient: QueryClient, payload: unknown): void {
  if (!isConversationPeerReadPayload(payload)) return;
  const key = messengerQueryKeys.messages(payload.conversationId);
  queryClient.setQueryData<MessengerMessagesPage>(key, (page) => {
    if (!page) return page;
    const items = applyPeerReadToMessages(page.items, payload);
    return items === page.items ? page : { ...page, items };
  });
}

function applyCoreAccess(
  queryClient: QueryClient,
  payload: unknown,
): MessengerWsConversationAccessChangedPayload | null {
  if (!isConversationAccessChangedPayload(payload)) return null;
  applyMessengerAccessChanged(queryClient, payload.zone, payload.conversationId, payload.zone);
  return payload;
}
