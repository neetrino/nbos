'use client';

import { useState, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { useMessengerMessages } from '@/features/messenger/query/use-messenger-messages';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import { messengerComposerSenderName } from '@/features/messenger/query/messenger-local-send';
import { InternalConversationThread } from '@/features/messenger-internal/InternalConversationThread';
import { sendInternalThreadMessage } from '@/features/messenger-internal/send-internal-thread-message';
import { toggleInternalFavorite } from '@/features/messenger-internal/internal-messenger-cache-ops';
import { usePermission } from '@/lib/permissions/PermissionContext';

type TaskLinkedThreadProps = {
  conversationId: string;
  composerDisabled: boolean;
};

export function TaskLinkedMessengerThread({
  conversationId,
  composerDisabled,
}: TaskLinkedThreadProps) {
  const queryClient = useQueryClient();
  const { me } = usePermission();
  const [draft, setDraft] = useState('');
  const conversation = useQuery({
    queryKey: ['messenger', 'conversation', conversationId],
    queryFn: () => messengerCoreApi.getConversation(conversationId),
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
  const messages = useMessengerMessages(conversationId, { enabled: true, zone: 'INTERNAL' });
  const listed = useListedConversation(conversationId);
  const row = mergeConversation(conversation.data, listed);
  if (!row) {
    return <p className="text-muted-foreground p-6 text-sm">Loading conversation…</p>;
  }
  return (
    <InternalConversationThread
      conversation={row}
      messages={messages.data?.items ?? []}
      peerLastReadAt={messages.data?.meta.peerLastReadAt ?? null}
      messagesLoading={messages.isPending && messages.data === undefined}
      newMessage={draft}
      onNewMessageChange={setDraft}
      onSend={(extras) =>
        void sendInternalThreadMessage({
          conversationId,
          canWrite: Boolean(row.canWrite) && !composerDisabled,
          content: draft,
          extras,
          setNewMessage: setDraft,
          queryClient,
          senderId: me?.id ?? null,
          senderName: messengerComposerSenderName(me),
        })
      }
      canSend={Boolean(row.canWrite) && !composerDisabled}
      sendDisabled={composerDisabled}
      onToggleFavorite={() => void toggleInternalFavorite(queryClient, conversationId)}
      collections={[]}
      onAddToCollection={() => undefined}
      remoteTypingHint={null}
    />
  );
}

function useListedConversation(conversationId: string): MessengerCoreConversationRow | null {
  const queryClient = useQueryClient();
  return useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => readListedConversation(queryClient, conversationId),
    () => null,
  );
}

function readListedConversation(
  queryClient: QueryClient,
  conversationId: string,
): MessengerCoreConversationRow | null {
  const queries = queryClient.getQueriesData<{ items?: MessengerCoreConversationRow[] }>({
    queryKey: messengerQueryKeys.internalSummariesRoot,
  });
  for (const [, data] of queries) {
    const match = data?.items?.find((row) => row.id === conversationId);
    if (match) return match;
  }
  return null;
}

function mergeConversation(
  fetched: MessengerCoreConversationRow | undefined,
  listed: MessengerCoreConversationRow | null,
): MessengerCoreConversationRow | null {
  if (!fetched && !listed) return null;
  return {
    ...(fetched ?? listed)!,
    ...(listed ?? {}),
    pinnedMessage: listed?.pinnedMessage ?? fetched?.pinnedMessage ?? null,
    canWrite: listed?.canWrite ?? fetched?.canWrite,
  };
}
