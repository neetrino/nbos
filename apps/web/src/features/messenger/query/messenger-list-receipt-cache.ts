import type { QueryClient } from '@tanstack/react-query';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import type { MessengerZone } from './messenger-query-keys';
import { messengerQueryKeys } from './messenger-query-keys';
import { compareIsoInstants } from './messenger-realtime-watermarks';

function summariesRoot(zone: MessengerZone) {
  return zone === 'CLIENT'
    ? messengerQueryKeys.clientSummariesRoot
    : messengerQueryKeys.internalSummariesRoot;
}

/** Marks the sidebar receipt as seen when a peer advances past our latest send. */
export function patchConversationLastMessageSeen(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
  lastReadAt: string,
): void {
  queryClient.setQueriesData<{ items: MessengerCoreConversationRow[] }>(
    { queryKey: summariesRoot(zone) },
    (current) => {
      if (!current?.items) return current;
      let changed = false;
      const items = current.items.map((row) => {
        if (row.id !== conversationId || !row.lastMessageMine || row.lastMessageSeen) return row;
        if (!row.lastMessageAt || compareIsoInstants(lastReadAt, row.lastMessageAt) < 0) return row;
        changed = true;
        return { ...row, lastMessageSeen: true };
      });
      return changed ? { ...current, items } : current;
    },
  );
}

/**
 * Aligns sidebar stamp/receipts with the opened thread (detail fetch has no list receipt fields).
 */
export function syncConversationListReceipt(
  queryClient: QueryClient,
  zone: MessengerZone,
  input: {
    conversationId: string;
    viewerId: string | null | undefined;
    messages: MessengerCoreMessageRow[];
    peerLastReadAt: string | null | undefined;
  },
): void {
  const latest = input.messages[input.messages.length - 1];
  if (!latest || !input.viewerId) return;
  const lastMessageMine = latest.senderId === input.viewerId;
  const peerRead = input.peerLastReadAt;
  const lastMessageSeen =
    lastMessageMine && peerRead != null && compareIsoInstants(peerRead, latest.createdAt) >= 0;
  queryClient.setQueriesData<{ items: MessengerCoreConversationRow[] }>(
    { queryKey: summariesRoot(zone) },
    (current) => {
      if (!current?.items) return current;
      let changed = false;
      const items = current.items.map((row) => {
        if (row.id !== input.conversationId) return row;
        if (
          row.lastMessageAt === latest.createdAt &&
          row.lastMessagePreview === latest.content &&
          row.lastMessageMine === lastMessageMine &&
          row.lastMessageSeen === lastMessageSeen
        ) {
          return row;
        }
        changed = true;
        return {
          ...row,
          lastMessageAt: latest.createdAt,
          lastMessagePreview: latest.content,
          lastMessageMine,
          lastMessageSeen,
        };
      });
      return changed ? { ...current, items } : current;
    },
  );
}
