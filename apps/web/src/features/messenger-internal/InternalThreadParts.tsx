'use client';

import type { RefObject } from 'react';
import type { MessengerViewMessage } from '@/features/messenger/messenger-message-mapper';
import { ComposerField } from './InternalThreadChrome';
import { ThreadMessageRow } from './InternalThreadMessageRow';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { SheetThreadHeader } from './InternalSheetHeader';
import { InternalReplyQuote } from './InternalReplyQuote';
import {
  SHEET_COMPOSER_OVERLAY_PAD_CLASS,
  SHEET_COMPOSER_REPLY_PAD_CLASS,
} from './internal-messenger.constants';
import { InternalTypingIndicator } from './InternalTypingIndicator';
import type { ConversationTypingPeer } from './messenger-conversation-typing';
import { useSheetMessengerPalette } from './sheet-messenger-palette';

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
    <SheetThreadHeader
      conversation={conversation}
      title={title}
      collections={collections}
      onToggleFavorite={onToggleFavorite}
      onAddToCollection={onAddToCollection}
    />
  );
}

export function ThreadMessages({
  views,
  messages,
  messagesLoading,
  selectedIds,
  selecting = false,
  onToggleSelect,
  onMessageContextMenu,
  onOpenOriginalSource,
  remoteTypingHint,
  typingPeer = null,
  scrollerRef,
  sheet = false,
  meId = null,
  replyActive = false,
}: {
  views: MessengerViewMessage[];
  messages: MessengerCoreMessageRow[];
  messagesLoading: boolean;
  selectedIds: string[];
  selecting?: boolean;
  onToggleSelect: (id: string) => void;
  onMessageContextMenu?: (id: string, x: number, y: number) => void;
  onOpenOriginalSource: (sourceMessageId: string) => void;
  remoteTypingHint: string | null;
  typingPeer?: ConversationTypingPeer | null;
  scrollerRef: RefObject<HTMLDivElement | null>;
  sheet?: boolean;
  meId?: string | null;
  replyActive?: boolean;
}) {
  const palette = useSheetMessengerPalette();
  const pad = replyActive ? SHEET_COMPOSER_REPLY_PAD_CLASS : SHEET_COMPOSER_OVERLAY_PAD_CLASS;
  const canvas = sheet ? `${palette.canvas} py-6 ${pad}` : 'py-3';
  return (
    <div ref={scrollerRef} className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${canvas}`}>
      {messagesLoading ? (
        <p className="px-5 py-8 text-center text-sm text-[#64748b]">Loading…</p>
      ) : views.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-[#64748b]">No messages yet.</p>
      ) : (
        <ThreadRows
          views={views}
          messages={messages}
          selectedIds={selectedIds}
          selecting={selecting}
          onToggleSelect={onToggleSelect}
          onMessageContextMenu={onMessageContextMenu}
          onOpenOriginalSource={onOpenOriginalSource}
          sheet={sheet}
          meId={meId}
        />
      )}
      {typingPeer ? (
        <InternalTypingIndicator peer={typingPeer} />
      ) : remoteTypingHint ? (
        <p className="px-5 pt-1 text-xs text-black/40">{remoteTypingHint}</p>
      ) : null}
    </div>
  );
}

function ThreadRows({
  views,
  messages,
  selectedIds,
  selecting,
  onToggleSelect,
  onMessageContextMenu,
  onOpenOriginalSource,
  sheet,
  meId,
}: {
  views: MessengerViewMessage[];
  messages: MessengerCoreMessageRow[];
  selectedIds: string[];
  selecting: boolean;
  onToggleSelect: (id: string) => void;
  onMessageContextMenu?: (id: string, x: number, y: number) => void;
  onOpenOriginalSource: (sourceMessageId: string) => void;
  sheet: boolean;
  meId: string | null;
}) {
  return views.map((message, index) => (
    <ThreadMessageRow
      key={message.id}
      message={message}
      previous={views[index - 1]}
      next={views[index + 1]}
      selected={selectedIds.includes(message.id)}
      references={messages.find((item) => item.id === message.id)?.references ?? []}
      onToggleSelect={onToggleSelect}
      onMessageContextMenu={onMessageContextMenu}
      onOpenOriginalSource={onOpenOriginalSource}
      selecting={selecting}
      sheet={sheet}
      mine={Boolean(meId) && message.senderId === meId}
    />
  ));
}

export function ThreadComposer({
  canSend,
  sendDisabled,
  newMessage,
  onNewMessageChange,
  replyTo,
  onClearReply,
  onSend,
  onTypingIntent,
  placeholder,
  sheet = false,
}: {
  canSend: boolean;
  sendDisabled: boolean;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  replyTo: MessengerCoreMessageRow | null;
  onClearReply: () => void;
  onSend: () => void;
  onTypingIntent?: () => void;
  placeholder?: string;
  sheet?: boolean;
}) {
  const resolvedPlaceholder =
    placeholder ?? (canSend ? 'Message' : 'You cannot send in this conversation');
  const blocked = !canSend || sendDisabled || newMessage.trim().length === 0;
  return (
    <div
      className={
        sheet
          ? 'pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-transparent'
          : 'border-t border-black/[0.06] p-3'
      }
    >
      <div className={sheet ? 'pointer-events-auto' : undefined}>
        {replyTo ? <ReplySlot sheet={sheet} replyTo={replyTo} onClear={onClearReply} /> : null}
        <ComposerField
          sheet={sheet}
          value={newMessage}
          onChange={(value) => {
            onNewMessageChange(value);
            onTypingIntent?.();
          }}
          onSend={onSend}
          disabled={!canSend || sendDisabled}
          sendDisabled={blocked}
          placeholder={resolvedPlaceholder}
        />
      </div>
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
    <div className={sheet ? 'pt-2' : undefined}>
      <InternalReplyQuote
        senderName={replyTo.senderName}
        content={replyTo.content}
        onClear={onClear}
      />
    </div>
  );
}
