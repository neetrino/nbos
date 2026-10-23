'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { useMessengerMessages } from '@/features/messenger/query/use-messenger-messages';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import { messengerComposerSenderName } from '@/features/messenger/query/messenger-local-send';
import {
  InternalConversationThread,
  type InternalSendExtras,
} from '@/features/messenger-internal/InternalConversationThread';
import { sendInternalThreadMessage } from '@/features/messenger-internal/send-internal-thread-message';
import { sendTaskDiscussionNote } from './use-task-discussion';
import { toggleInternalFavorite } from '@/features/messenger-internal/internal-messenger-cache-ops';
import { usePermission } from '@/lib/permissions/PermissionContext';

type TaskLinkedThreadProps = {
  taskId: string;
  conversationId: string;
  composerDisabled: boolean;
  /** Shown when Messenger cannot open this Task chat. Posting still follows Task access. */
  fallback?: ReactNode;
};

export function TaskLinkedMessengerThread({
  taskId,
  conversationId,
  composerDisabled,
  fallback = null,
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
    if (conversation.isError) return <>{fallback}</>;
    return <p className="text-muted-foreground p-6 text-sm">Loading conversation…</p>;
  }
  const canPost = !composerDisabled;
  return (
    <InternalConversationThread
      conversation={row}
      messages={messages.data?.items ?? []}
      peerLastReadAt={messages.data?.meta.peerLastReadAt ?? null}
      messagesLoading={messages.isPending && messages.data === undefined}
      newMessage={draft}
      onNewMessageChange={setDraft}
      onSend={(extras) =>
        void sendTaskLinkedMessage({
          taskId,
          conversationId,
          canPost,
          draft,
          extras,
          setDraft,
          queryClient,
          senderId: me?.id ?? null,
          senderName: messengerComposerSenderName(me),
        })
      }
      canSend={canPost}
      sendDisabled={composerDisabled}
      composerDocked
      onToggleFavorite={() => void toggleInternalFavorite(queryClient, conversationId)}
      collections={[]}
      onAddToCollection={() => undefined}
      remoteTypingHint={null}
    />
  );
}

function sendTaskLinkedMessage(input: {
  taskId: string;
  conversationId: string;
  canPost: boolean;
  draft: string;
  extras: InternalSendExtras;
  setDraft: (value: string) => void;
  queryClient: QueryClient;
  senderId: string | null;
  senderName: string;
}): Promise<void> {
  const files = input.extras.fileAssetIds ?? [];
  const forwards = input.extras.forwardSourceIds ?? [];
  if (files.length > 0 || forwards.length > 0) {
    return sendInternalThreadMessage({
      conversationId: input.conversationId,
      canWrite: input.canPost,
      content: input.draft,
      extras: input.extras,
      setNewMessage: input.setDraft,
      queryClient: input.queryClient,
      senderId: input.senderId,
      senderName: input.senderName,
    });
  }
  if (!input.canPost) return Promise.resolve();
  return sendTaskDiscussionNote(
    input.queryClient,
    input.taskId,
    input.conversationId,
    input.extras.caption ?? input.draft,
    { senderId: input.senderId, senderName: input.senderName },
    {
      replyToMessageId: input.extras.replyToMessageId,
      onComposerClear: () => input.setDraft(''),
    },
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
