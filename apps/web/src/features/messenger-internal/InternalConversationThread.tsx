'use client';

import { useRef, type RefObject } from 'react';
import {
  mapMessengerRowToView,
  type MessengerViewMessage,
} from '@/features/messenger/messenger-message-mapper';
import { usePermission } from '@/lib/permissions';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import {
  internalSheetDeliveryLabel,
  internalSheetMessageSeen,
} from './internal-sheet-delivery-label';
import { conversationListTitle } from './internal-messenger-section';
import { InternalMessageActionsBar } from './InternalMessageActionsBar';
import { InternalMessageSelectionBar } from './InternalMessageSelectionBar';
import { InternalJumpToEndButton } from './InternalJumpToEndButton';
import { InternalThreadActionDialogs } from './InternalThreadActionDialogs';
import { ThreadComposer, ThreadHeader, ThreadMessages } from './InternalThreadParts';
import type { ConversationTypingPeer } from './messenger-conversation-typing';
import { useInternalThreadActions } from './use-internal-thread-actions';
import { useScrollThreadToEnd } from './use-scroll-thread-to-end';

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
  typingPeer = null,
  onTypingIntent,
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
  typingPeer?: ConversationTypingPeer | null;
  onTypingIntent?: () => void;
  onOpenInternalSource?: (conversationId: string) => void;
  peerLastReadAt?: string | null;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { can, me } = usePermission();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const actions = useInternalThreadActions(messages, onOpenInternalSource, me?.id);
  const last = messages.at(-1);
  const endScroll = useScrollThreadToEnd(
    scrollerRef,
    last?.id,
    conversation.id,
    Boolean(me && last?.senderId === me.id),
  );

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
      typingPeer={typingPeer}
      onTypingIntent={onTypingIntent}
      canCreateTask={can('EDIT', 'TASKS') && Boolean(creatorId)}
      creatorId={creatorId}
      creatorReady={creatorReady}
      actions={actions}
      scrollerRef={scrollerRef}
      showJumpToEnd={endScroll.showJumpToEnd}
      onJumpToEnd={endScroll.jumpToEnd}
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
  typingPeer?: ConversationTypingPeer | null;
  onTypingIntent?: () => void;
  canCreateTask: boolean;
  creatorId: string | null;
  creatorReady: boolean;
  actions: ReturnType<typeof useInternalThreadActions>;
  scrollerRef: RefObject<HTMLDivElement | null>;
  showJumpToEnd: boolean;
  onJumpToEnd: () => void;
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
        anchor={actions.menuAnchor}
        onClose={actions.closeActionMenu}
        canCreateTask={props.canCreateTask}
        onReply={() => actions.startReply()}
        onForward={() => actions.setForwardOpen(true)}
        onCreateTask={() => actions.setCreateTaskOpen(true)}
        onOpenOriginal={() => void actions.openOriginal()}
        onCopySource={() => void actions.copySource()}
        onSelect={actions.startSelecting}
        onDelete={actions.canDeleteOwn ? actions.requestDelete : undefined}
      />
      {actions.selecting ? (
        <InternalMessageSelectionBar
          selectedCount={actions.selectedMessages.length}
          canCreateTask={props.canCreateTask}
          onForward={() => actions.setForwardOpen(true)}
          onCreateTask={() => actions.setCreateTaskOpen(true)}
          onCopySource={() => void actions.copySource()}
          onDelete={actions.canDeleteOwn ? actions.requestDelete : undefined}
          onDone={actions.clearSelection}
        />
      ) : null}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ThreadMessages
          views={props.views}
          messages={props.messages}
          messagesLoading={props.messagesLoading}
          selectedIds={actions.selectedIds}
          selecting={actions.selecting}
          onToggleSelect={actions.toggleSelect}
          onMessageContextMenu={actions.openActionMenu}
          onOpenOriginalSource={actions.openOriginalBySourceId}
          remoteTypingHint={props.remoteTypingHint}
          typingPeer={props.typingPeer}
          scrollerRef={props.scrollerRef}
          sheet
          meId={props.meId}
        />
        <InternalJumpToEndButton visible={props.showJumpToEnd} onJump={props.onJumpToEnd} />
      </div>
      <ThreadComposer
        canSend={props.canSend}
        sendDisabled={props.sendDisabled}
        newMessage={props.newMessage}
        onNewMessageChange={props.onNewMessageChange}
        replyTo={actions.replyTo}
        onClearReply={actions.clearReply}
        onTypingIntent={props.onTypingIntent}
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
      <InternalThreadActionDialogs
        conversation={conversation}
        actions={actions}
        creatorId={props.creatorId}
        creatorReady={props.creatorReady}
      />
    </section>
  );
}
