'use client';

import { useEffect, useRef, type RefObject } from 'react';
import {
  mapMessengerRowToView,
  type MessengerViewMessage,
} from '@/features/messenger/messenger-message-mapper';
import { usePermission } from '@/lib/permissions';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import type { Task } from '@/lib/api/tasks';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import {
  internalSheetDeliveryLabel,
  internalSheetMessageSeen,
} from './internal-sheet-delivery-label';
import { conversationListTitle } from './internal-messenger-section';
import { InternalCreateTaskFromMessages } from './InternalCreateTaskFromMessages';
import { InternalForwardDialog } from './InternalForwardDialog';
import { InternalMessageActionsBar } from './InternalMessageActionsBar';
import { ThreadComposer, ThreadHeader, ThreadMessages } from './InternalThreadParts';
import { useInternalThreadActions } from './use-internal-thread-actions';

function toViewMessages(
  rows: MessengerCoreMessageRow[],
  peerLastReadAt: string | null,
): MessengerViewMessage[] {
  return rows.map((row) => ({
    ...mapMessengerRowToView({
      id: row.id,
      channelId: row.conversationId,
      senderId: row.senderId ?? '',
      senderName: row.senderName,
      content: row.content,
      createdAt: row.createdAt,
      editedAt: row.editedAt,
      attachments: row.attachments,
    }),
    deliveryLabel: internalSheetDeliveryLabel(row.status),
    receiptSeen: internalSheetMessageSeen(row.status, row.createdAt, peerLastReadAt),
  }));
}

export type InternalSendExtras = {
  replyToMessageId?: string;
  mentionedEmployeeIds?: string[];
};

export function InternalConversationThread({
  conversation,
  messages,
  messagesLoading,
  newMessage,
  onNewMessageChange,
  onSend,
  canSend,
  sendDisabled,
  onToggleFavorite,
  collections,
  onAddToCollection,
  remoteTypingHint,
  onOpenInternalSource,
  peerLastReadAt = null,
}: {
  conversation: MessengerCoreConversationRow;
  messages: MessengerCoreMessageRow[];
  messagesLoading: boolean;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSend: (extras: InternalSendExtras) => Promise<void> | void;
  canSend: boolean;
  sendDisabled: boolean;
  onToggleFavorite: () => void;
  collections: Array<{ id: string; name: string }>;
  onAddToCollection: (collectionId: string) => void;
  remoteTypingHint: string | null;
  onOpenInternalSource?: (conversationId: string) => void;
  peerLastReadAt?: string | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const { can, me } = usePermission();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const actions = useInternalThreadActions(messages, onOpenInternalSource);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <ThreadScaffold
      conversation={conversation}
      messages={messages}
      messagesLoading={messagesLoading}
      views={toViewMessages(messages, peerLastReadAt ?? null)}
      newMessage={newMessage}
      onNewMessageChange={onNewMessageChange}
      onSend={onSend}
      canSend={canSend}
      sendDisabled={sendDisabled}
      onToggleFavorite={onToggleFavorite}
      collections={collections}
      onAddToCollection={onAddToCollection}
      remoteTypingHint={remoteTypingHint}
      canCreateTask={can('EDIT', 'TASKS') && Boolean(creatorId)}
      creatorId={creatorId}
      creatorReady={creatorReady}
      actions={actions}
      endRef={endRef}
      meId={me?.id ?? null}
    />
  );
}

function ThreadScaffold(props: {
  conversation: MessengerCoreConversationRow;
  messages: MessengerCoreMessageRow[];
  messagesLoading: boolean;
  views: MessengerViewMessage[];
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSend: (extras: InternalSendExtras) => Promise<void> | void;
  canSend: boolean;
  sendDisabled: boolean;
  onToggleFavorite: () => void;
  collections: Array<{ id: string; name: string }>;
  onAddToCollection: (collectionId: string) => void;
  remoteTypingHint: string | null;
  canCreateTask: boolean;
  creatorId: string | null;
  creatorReady: boolean;
  actions: ReturnType<typeof useInternalThreadActions>;
  endRef: RefObject<HTMLDivElement | null>;
  meId: string | null;
}) {
  const { conversation, actions } = props;
  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#eef2ff]">
      <ThreadHeader
        conversation={conversation}
        title={conversationListTitle(
          conversation.type,
          conversation.title,
          conversation.peerName ?? null,
        )}
        collections={props.collections}
        onToggleFavorite={props.onToggleFavorite}
        onAddToCollection={props.onAddToCollection}
      />
      <InternalMessageActionsBar
        selectedCount={actions.selectedMessages.length}
        canReply={actions.selectedMessages.length === 1}
        canCreateTask={props.canCreateTask}
        onReply={actions.startReply}
        onForward={() => actions.setForwardOpen(true)}
        onCreateTask={() => actions.setCreateTaskOpen(true)}
        onOpenOriginal={() => void actions.openOriginal()}
        onCopySource={() => void actions.copySource()}
        onClear={actions.clearSelection}
      />
      <ThreadMessages
        views={props.views}
        messages={props.messages}
        messagesLoading={props.messagesLoading}
        selectedIds={actions.selectedIds}
        onToggleSelect={actions.toggleSelect}
        onOpenOriginalSource={actions.openOriginalBySourceId}
        remoteTypingHint={props.remoteTypingHint}
        endRef={props.endRef}
        sheet
        meId={props.meId}
      />
      <ThreadComposer
        canSend={props.canSend}
        sendDisabled={props.sendDisabled}
        newMessage={props.newMessage}
        onNewMessageChange={props.onNewMessageChange}
        replyTo={actions.replyTo}
        onClearReply={actions.clearReply}
        sheet
        onSend={() =>
          void Promise.resolve(
            props.onSend({
              replyToMessageId: actions.replyTo?.id,
            }),
          ).then(() => {
            actions.clearReply();
          })
        }
      />
      <ThreadActionDialogs
        conversation={conversation}
        actions={actions}
        creatorId={props.creatorId}
        creatorReady={props.creatorReady}
      />
    </section>
  );
}

function ThreadActionDialogs({
  conversation,
  actions,
  creatorId,
  creatorReady,
}: {
  conversation: MessengerCoreConversationRow;
  actions: ReturnType<typeof useInternalThreadActions>;
  creatorId: string | null;
  creatorReady: boolean;
}) {
  return (
    <>
      <InternalForwardDialog
        open={actions.forwardOpen}
        currentConversationId={conversation.id}
        onClose={() => actions.setForwardOpen(false)}
        onForward={(targetConversationId) => forwardSelected(targetConversationId, actions)}
      />
      {creatorId ? (
        <InternalCreateTaskFromMessages
          open={actions.createTaskOpen}
          creatorId={creatorId}
          creatorReady={creatorReady}
          defaultLinks={conversation.primaryLinks}
          selectedCount={actions.selectedMessages.length}
          onOpenChange={actions.setCreateTaskOpen}
          onCreated={(task) => void attachSources(task, actions)}
        />
      ) : null}
    </>
  );
}

async function forwardSelected(
  targetConversationId: string,
  actions: ReturnType<typeof useInternalThreadActions>,
): Promise<void> {
  const result = await messengerCoreApi.forwardMessages(
    targetConversationId,
    actions.selectedMessages.map((row) => row.id),
  );
  if (result.createdConversation !== false) return;
  toast.success('Forwarded as a reference');
  actions.clearSelection();
}

async function attachSources(
  task: Task,
  actions: ReturnType<typeof useInternalThreadActions>,
): Promise<void> {
  try {
    await messengerCoreApi.attachTaskSources(
      actions.selectedMessages.map((row) => row.id),
      task.id,
    );
    toast.success('Task created with source references');
    actions.clearSelection();
    actions.setCreateTaskOpen(false);
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Task was created but source references failed.'));
  }
}
