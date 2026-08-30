'use client';

import { useEffect, useRef } from 'react';
import { Hash, Star, User } from 'lucide-react';
import { messengerDateLabel } from '@/features/messenger/messenger-format';
import {
  mapMessengerRowToView,
  type MessengerViewMessage,
} from '@/features/messenger/messenger-message-mapper';
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
import { conversationListTitle, conversationTypeBadge } from './internal-messenger-section';

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
}: {
  conversation: MessengerCoreConversationRow;
  messages: MessengerCoreMessageRow[];
  messagesLoading: boolean;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSend: () => void;
  canSend: boolean;
  sendDisabled: boolean;
  onToggleFavorite: () => void;
  collections: Array<{ id: string; name: string }>;
  onAddToCollection: (collectionId: string) => void;
  remoteTypingHint: string | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const views = toViewMessages(messages);
  const title = conversationListTitle(
    conversation.type,
    conversation.title,
    conversation.peerName ?? null,
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
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
      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        {messagesLoading ? (
          <p className="px-5 py-8 text-center text-sm text-black/40">Loading…</p>
        ) : views.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-black/40">No messages yet.</p>
        ) : (
          views.map((message, index) => {
            const previous = views[index - 1];
            const showDate =
              !previous ||
              messengerDateLabel(previous.timestamp) !== messengerDateLabel(message.timestamp);
            return (
              <div key={message.id}>
                {showDate ? (
                  <MessengerThreadDateDivider label={messengerDateLabel(message.timestamp)} />
                ) : null}
                <MessengerThreadMessageBubble message={message} readReceiptLabel={null} />
              </div>
            );
          })
        )}
        {remoteTypingHint ? (
          <p className="px-5 pt-1 text-xs text-black/40">{remoteTypingHint}</p>
        ) : null}
        <div ref={endRef} />
      </div>
      <div className="border-t border-black/[0.06] p-3">
        <MessengerThreadComposerRow
          value={newMessage}
          onChange={onNewMessageChange}
          onSend={onSend}
          disabled={!canSend || sendDisabled}
          sendDisabled={!canSend || sendDisabled || newMessage.trim().length === 0}
          placeholder={
            canSend ? 'Write an Internal message…' : 'You cannot send in this conversation'
          }
        />
      </div>
    </section>
  );
}
