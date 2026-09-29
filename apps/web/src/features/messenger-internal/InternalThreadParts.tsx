'use client';

import type { RefObject } from 'react';
import { messengerDateLabel } from '@/features/messenger/messenger-format';
import type { MessengerViewMessage } from '@/features/messenger/messenger-message-mapper';
import { MessengerThreadMessageBubble } from '@/features/messenger/messenger-thread-primitives';
import {
  ComposerField,
  FavoriteStar,
  MessageDate,
  MessageSelect,
  ThreadAvatar,
} from './InternalThreadChrome';
import { InternalSheetMessage } from './InternalSheetMessage';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { conversationTypeBadge } from './internal-messenger-section';
import { AddToCollectionSelect } from './AddToCollectionSelect';
import { InternalForwardReferenceCard } from './InternalForwardReferenceCard';
import { InternalMentionPicker } from './InternalMentionPicker';
import { InternalReplyQuote } from './InternalReplyQuote';

export function ThreadHeader({
  conversation,
  title,
  collections,
  onToggleFavorite,
  onAddToCollection,
}: {
  conversation: MessengerCoreConversationRow;
  title: string;
  collections: Array<{ id: string; name: string }>;
  onToggleFavorite: () => void;
  onAddToCollection: (collectionId: string) => void;
}) {
  const direct = conversation.type === 'DIRECT';
  return (
    <header className="flex items-center gap-3 border-b border-[#f1f5f9] bg-white py-3.5 pr-3 pl-5">
      <ThreadAvatar title={title} direct={direct} employeeId={conversation.peerEmployeeId} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm text-[#0f172a]">{title}</h2>
          <span className="shrink-0 rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-2 py-0.5 text-[10px] text-[#4338ca]">
            {conversationTypeBadge(conversation.type)}
          </span>
          <FavoriteStar favorite={Boolean(conversation.isFavorite)} onToggle={onToggleFavorite} />
        </div>
        <p className="text-xs text-[#64748b]">Internal</p>
      </div>
      <AddToCollectionSelect collections={collections} onAdd={onAddToCollection} />
    </header>
  );
}

export function ThreadMessages({
  views,
  messages,
  messagesLoading,
  selectedIds,
  onToggleSelect,
  onOpenOriginalSource,
  remoteTypingHint,
  endRef,
  sheet = false,
  meId = null,
}: {
  views: MessengerViewMessage[];
  messages: MessengerCoreMessageRow[];
  messagesLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenOriginalSource: (sourceMessageId: string) => void;
  remoteTypingHint: string | null;
  endRef: RefObject<HTMLDivElement | null>;
  sheet?: boolean;
  meId?: string | null;
}) {
  const canvas = sheet ? 'gap-6 bg-[#eef2ff] py-6' : 'py-3';
  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${canvas}`}>
      {messagesLoading ? (
        <p className="px-5 py-8 text-center text-sm text-[#64748b]">Loading…</p>
      ) : views.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-[#64748b]">No messages yet.</p>
      ) : (
        views.map((message, index) => (
          <ThreadMessageRow
            key={message.id}
            message={message}
            previous={views[index - 1]}
            selected={selectedIds.includes(message.id)}
            references={messages.find((item) => item.id === message.id)?.references ?? []}
            onToggleSelect={onToggleSelect}
            onOpenOriginalSource={onOpenOriginalSource}
            sheet={sheet}
            mine={Boolean(meId) && message.senderId === meId}
          />
        ))
      )}
      {remoteTypingHint ? (
        <p className="px-5 pt-1 text-xs text-black/40">{remoteTypingHint}</p>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}

function ThreadMessageRow({
  message,
  previous,
  selected,
  references,
  onToggleSelect,
  onOpenOriginalSource,
  sheet,
  mine,
}: {
  message: MessengerViewMessage;
  previous: MessengerViewMessage | undefined;
  selected: boolean;
  references: NonNullable<MessengerCoreMessageRow['references']>;
  onToggleSelect: (id: string) => void;
  onOpenOriginalSource: (sourceMessageId: string) => void;
  sheet: boolean;
  mine: boolean;
}) {
  const showDate =
    !previous || messengerDateLabel(previous.timestamp) !== messengerDateLabel(message.timestamp);
  const label = messengerDateLabel(message.timestamp);
  return (
    <div className="group flex items-start gap-1">
      <MessageSelect selected={selected} onToggle={() => onToggleSelect(message.id)} />
      <div className="min-w-0 flex-1">
        {showDate ? <MessageDate label={label} sheet={sheet} /> : null}
        {sheet ? (
          <InternalSheetMessage
            message={message}
            mine={mine}
            readReceiptLabel={message.deliveryLabel ?? null}
          />
        ) : (
          <MessengerThreadMessageBubble
            message={message}
            readReceiptLabel={message.deliveryLabel ?? null}
          />
        )}
        <InternalForwardReferenceCard
          references={references}
          onOpenOriginal={onOpenOriginalSource}
        />
      </div>
    </div>
  );
}

export function ThreadComposer({
  canSend,
  sendDisabled,
  newMessage,
  onNewMessageChange,
  replyTo,
  onClearReply,
  mentions,
  onMentionsChange,
  onSend,
  placeholder,
  sheet = false,
}: {
  canSend: boolean;
  sendDisabled: boolean;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  replyTo: MessengerCoreMessageRow | null;
  onClearReply: () => void;
  mentions: Array<{ id: string; label: string }>;
  onMentionsChange: (next: Array<{ id: string; label: string }>) => void;
  onSend: () => void;
  placeholder?: string;
  sheet?: boolean;
}) {
  const resolvedPlaceholder =
    placeholder ?? (canSend ? 'Message' : 'You cannot send in this conversation');
  const blocked = !canSend || sendDisabled || newMessage.trim().length === 0;
  return (
    <div className={sheet ? 'bg-[#eef2ff]' : 'border-t border-black/[0.06] p-3'}>
      {replyTo ? <ReplySlot sheet={sheet} replyTo={replyTo} onClear={onClearReply} /> : null}
      {canSend ? <InternalMentionPicker selected={mentions} onChange={onMentionsChange} /> : null}
      <ComposerField
        sheet={sheet}
        value={newMessage}
        onChange={onNewMessageChange}
        onSend={onSend}
        disabled={!canSend || sendDisabled}
        sendDisabled={blocked}
        placeholder={resolvedPlaceholder}
      />
    </div>
  );
}

function ReplySlot({
  sheet,
  replyTo,
  onClear,
}: {
  sheet: boolean;
  replyTo: MessengerCoreMessageRow;
  onClear: () => void;
}) {
  return (
    <div className={sheet ? 'px-4 pt-2' : undefined}>
      <InternalReplyQuote
        senderName={replyTo.senderName}
        content={replyTo.content}
        onClear={onClear}
      />
    </div>
  );
}
