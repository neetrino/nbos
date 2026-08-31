'use client';

import { InternalConversationThread } from '@/features/messenger-internal/InternalConversationThread';
import type { EntityConversationKind } from './entity-conversation-kind';
import { useEntityConversation } from './use-entity-conversation';

export type { EntityConversationKind };

export function EntityConversationPanel({
  kind,
  entityId,
}: {
  kind: EntityConversationKind;
  entityId: string;
}) {
  const state = useEntityConversation(kind, entityId);

  if (!state.canView) {
    return (
      <p className="text-muted-foreground p-6 text-sm">
        You do not have access to Internal Messenger.
      </p>
    );
  }
  if (state.loading) {
    return <p className="text-muted-foreground p-6 text-sm">Loading conversation…</p>;
  }
  if (state.error || !state.conversation) {
    return <p className="p-6 text-sm text-red-600">{state.error ?? 'Conversation unavailable.'}</p>;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-black/[0.06]">
      <InternalConversationThread
        conversation={state.conversation}
        messages={state.messages}
        messagesLoading={false}
        newMessage={state.newMessage}
        onNewMessageChange={state.setNewMessage}
        onSend={state.send}
        canSend={Boolean(state.conversation.canWrite)}
        sendDisabled={state.sendBusy}
        onToggleFavorite={state.toggleFavorite}
        collections={[]}
        onAddToCollection={() => undefined}
        remoteTypingHint={null}
      />
    </div>
  );
}
