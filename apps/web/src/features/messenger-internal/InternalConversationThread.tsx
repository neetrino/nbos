'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
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
import { conversationListTitle } from './internal-messenger-section';
import { InternalCreateTaskFromMessages } from './InternalCreateTaskFromMessages';
import { InternalForwardDialog } from './InternalForwardDialog';
import { InternalMessageActionsBar } from './InternalMessageActionsBar';
import { ThreadComposer, ThreadHeader, ThreadMessages } from './InternalThreadParts';
import { useInternalThreadActions } from './use-internal-thread-actions';

function toViewMessages(rows: MessengerCoreMessageRow[]): MessengerViewMessage[] {
  return rows.map((row) =>
    mapMessengerRowToView({
      id: row.id,
      channelId: row.conversationId,
      senderId: row.senderId ?? '',
      senderName: row.senderName,
      content: row.content,
      createdAt: row.createdAt,
      editedAt: row.editedAt,
      attachments: row.attachments,
    }),
  );
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
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const { can } = usePermission();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const actions = useInternalThreadActions(messages, onOpenInternalSource);
  const [mentions, setMentions] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <ThreadScaffold
      conversation={conversation}
      messages={messages}
      messagesLoading={messagesLoading}
      views={toViewMessages(messages)}
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
      mentions={mentions}
      setMentions={setMentions}
      endRef={endRef}
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
  mentions: Array<{ id: string; label: string }>;
  setMentions: (next: Array<{ id: string; label: string }>) => void;
  endRef: RefObject<HTMLDivElement | null>;
}) {
  const { conversation, actions } = props;
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
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
      />
      <ThreadComposer
        canSend={props.canSend}
        sendDisabled={props.sendDisabled}
        newMessage={props.newMessage}
        onNewMessageChange={props.onNewMessageChange}
        replyTo={actions.replyTo}
        onClearReply={actions.clearReply}
        mentions={props.mentions}
        onMentionsChange={props.setMentions}
        onSend={() =>
          void Promise.resolve(
            props.onSend({
              replyToMessageId: actions.replyTo?.id,
              mentionedEmployeeIds: props.mentions.map((row) => row.id),
            }),
          ).then(() => {
            actions.clearReply();
            props.setMentions([]);
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
