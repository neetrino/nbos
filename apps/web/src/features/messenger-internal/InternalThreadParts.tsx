'use client';

import type { RefObject } from 'react';
import { Hash, Star, User } from 'lucide-react';
import { messengerDateLabel } from '@/features/messenger/messenger-format';
import type { MessengerViewMessage } from '@/features/messenger/messenger-message-mapper';
import { MESSENGER_THREAD_HASH_ICON_CLASS } from '@/features/messenger/messenger-thread-ui.constants';
import {
  MessengerThreadComposerRow,
  MessengerThreadDateDivider,
  MessengerThreadMessageBubble,
} from '@/features/messenger/messenger-thread-primitives';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { conversationTypeBadge } from './internal-messenger-section';
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
  return (
    <header className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-3">
      {conversation.type === 'DIRECT' ? (
        <User size={16} className={MESSENGER_THREAD_HASH_ICON_CLASS} />
      ) : (
        <Hash size={16} className={MESSENGER_THREAD_HASH_ICON_CLASS} />
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-black">{title}</h2>
        <p className="text-[11px] text-black/40">
          {conversationTypeBadge(conversation.type)} · Internal
        </p>
      </div>
      <button
        type="button"
        aria-label={conversation.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        onClick={onToggleFavorite}
        className="rounded-lg p-1.5 text-black/35 hover:bg-black/[0.04] hover:text-[#E5A84B]"
      >
        <Star
          size={16}
          className={conversation.isFavorite ? 'fill-[#E5A84B] text-[#E5A84B]' : ''}
        />
      </button>
      {collections.length > 0 ? (
        <select
          aria-label="Add to collection"
          defaultValue=""
          className="max-w-[10rem] rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-2 py-1 text-[11px] text-black"
          onChange={(event) => {
            const collectionId = event.target.value;
            if (!collectionId) return;
            onAddToCollection(collectionId);
            event.target.value = '';
          }}
        >
          <option value="">Add to collection</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      ) : null}
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
}: {
  views: MessengerViewMessage[];
  messages: MessengerCoreMessageRow[];
  messagesLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenOriginalSource: (sourceMessageId: string) => void;
  remoteTypingHint: string | null;
  endRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto py-3">
      {messagesLoading ? (
        <p className="px-5 py-8 text-center text-sm text-black/40">Loading…</p>
      ) : views.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-black/40">No messages yet.</p>
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
}: {
  message: MessengerViewMessage;
  previous: MessengerViewMessage | undefined;
  selected: boolean;
  references: NonNullable<MessengerCoreMessageRow['references']>;
  onToggleSelect: (id: string) => void;
  onOpenOriginalSource: (sourceMessageId: string) => void;
}) {
  const showDate =
    !previous || messengerDateLabel(previous.timestamp) !== messengerDateLabel(message.timestamp);
  return (
    <div className="flex items-start gap-1">
      <label className="mt-3 pl-3">
        <span className="sr-only">Select message</span>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(message.id)}
          className="accent-[#E5A84B]"
        />
      </label>
      <div className="min-w-0 flex-1">
        {showDate ? (
          <MessengerThreadDateDivider label={messengerDateLabel(message.timestamp)} />
        ) : null}
        <MessengerThreadMessageBubble message={message} readReceiptLabel={null} />
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
}) {
  return (
    <div className="border-t border-black/[0.06] p-3">
      {replyTo ? (
        <InternalReplyQuote
          senderName={replyTo.senderName}
          content={replyTo.content}
          onClear={onClearReply}
        />
      ) : null}
      {canSend ? <InternalMentionPicker selected={mentions} onChange={onMentionsChange} /> : null}
      <MessengerThreadComposerRow
        value={newMessage}
        onChange={onNewMessageChange}
        onSend={onSend}
        disabled={!canSend || sendDisabled}
        sendDisabled={!canSend || sendDisabled || newMessage.trim().length === 0}
        placeholder={
          placeholder ??
          (canSend ? 'Write an Internal message…' : 'You cannot send in this conversation')
        }
      />
    </div>
  );
}
