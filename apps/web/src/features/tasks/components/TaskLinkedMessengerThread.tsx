'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { useMessengerMessages } from '@/features/messenger/query/use-messenger-messages';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import { InternalConversationThread } from '@/features/messenger-internal/InternalConversationThread';
import { sendInternalThreadMessage } from '@/features/messenger-internal/send-internal-thread-message';
import { toggleInternalFavorite } from '@/features/messenger-internal/internal-messenger-cache-ops';

export function TaskLinkedMessengerThread({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [sendBusy, setSendBusy] = useState(false);
  const conversation = useQuery({
    queryKey: ['messenger', 'conversation', conversationId],
    queryFn: () => messengerCoreApi.getConversation(conversationId),
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
  const messages = useMessengerMessages(conversationId, { enabled: true, zone: 'INTERNAL' });
  const row = conversation.data;
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
          canWrite: Boolean(row.canWrite),
          sendBusy,
          content: draft,
          extras,
          setSendBusy,
          setNewMessage: setDraft,
          queryClient,
        })
      }
      canSend={Boolean(row.canWrite)}
      sendDisabled={sendBusy}
      onToggleFavorite={() => void toggleInternalFavorite(queryClient, conversationId)}
      collections={[]}
      onAddToCollection={() => undefined}
      remoteTypingHint={null}
    />
  );
}
