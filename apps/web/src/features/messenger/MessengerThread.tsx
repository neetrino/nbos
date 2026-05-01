import { useEffect, useRef } from 'react';
import { Hash, Paperclip, Send } from 'lucide-react';
import type { MessengerChannelRow } from '@/lib/api/messenger';
import { formatMessengerTime, messengerDateLabel } from './messenger-format';
import type { MessengerViewMessage } from './messenger-message-mapper';
import { MESSENGER_DM_READ_RECEIPT_LABEL } from './messenger-dm-read-receipt.util';
import { MESSENGER_CHANNEL_RECEIPT_OFFVIEW_HINT } from './messenger-channel-receipt-banner.constants';
import type { MessengerActiveView } from './messenger-active-view';

function readReceiptLabelForMessage(
  active: MessengerActiveView,
  msg: MessengerViewMessage,
  dmReadReceiptMessageId: string | null | undefined,
  channelReadReceipt: { seen: boolean; anchorId: string | null } | null | undefined,
): string | null {
  if (active.type === 'dm') {
    if (dmReadReceiptMessageId != null && dmReadReceiptMessageId === msg.id) {
      return MESSENGER_DM_READ_RECEIPT_LABEL;
    }
    return null;
  }
  if (
    active.type === 'channel' &&
    channelReadReceipt?.seen &&
    channelReadReceipt.anchorId === msg.id
  ) {
    return MESSENGER_DM_READ_RECEIPT_LABEL;
  }
  return null;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5A84B]/15 text-sm font-semibold text-[#E5A84B]">
      {initials}
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2">
      <div className="h-px flex-1 bg-black/[0.06]" />
      <span className="text-xs font-medium text-black/40">{label}</span>
      <div className="h-px flex-1 bg-black/[0.06]" />
    </div>
  );
}

function MessageBubble({
  message,
  readReceiptLabel,
}: {
  message: MessengerViewMessage;
  readReceiptLabel: string | null;
}) {
  return (
    <div className="group flex gap-3 px-5 py-1.5 hover:bg-black/[0.02]">
      <Avatar initials={message.initials} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-black">{message.senderName}</span>
          <span className="text-xs text-black/35">{formatMessengerTime(message.timestamp)}</span>
        </div>
        <p className="text-sm leading-relaxed text-black/75">{message.content}</p>
        {message.attachments.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F0] px-2 py-1 text-[11px] text-black/55"
              >
                <Paperclip size={11} />
                FileAsset {attachment.fileAssetId.slice(0, 8)}
              </span>
            ))}
          </div>
        ) : null}
        {readReceiptLabel ? (
          <p className="mt-0.5 text-[10px] font-medium text-black/35">{readReceiptLabel}</p>
        ) : null}
      </div>
    </div>
  );
}

function channelSubtitle(ch: MessengerChannelRow): string {
  const typeLabel =
    ch.type === 'project' ? 'Project' : ch.type === 'announcement' ? 'Announcement' : 'General';
  return `${typeLabel} · ${ch.projectId}`;
}

export function MessengerThread({
  active,
  channelRow,
  dmTitle,
  dmInitials,
  messages,
  messagesLoading,
  newMessage,
  onNewMessageChange,
  attachmentDraft,
  onAttachmentDraftChange,
  onSend,
  canSend,
  sendDisabled,
  remoteTypingHint,
  onComposerTypingIntent,
  dmReadReceiptMessageId,
  channelReadReceipt,
}: {
  active: MessengerActiveView;
  /** Undefined if the channel id is missing from the current list (stale selection). */
  channelRow: MessengerChannelRow | undefined;
  dmTitle: string;
  dmInitials: string;
  messages: MessengerViewMessage[];
  messagesLoading: boolean;
  newMessage: string;
  onNewMessageChange: (v: string) => void;
  attachmentDraft: string;
  onAttachmentDraftChange: (v: string) => void;
  onSend: () => void;
  canSend: boolean;
  sendDisabled: boolean;
  remoteTypingHint: string | null;
  onComposerTypingIntent?: () => void;
  /** When `active.type === 'dm'`, message id under which to show the read receipt. */
  dmReadReceiptMessageId?: string | null;
  /** When `active.type === 'channel'`, server-derived receipt for the viewer’s last own message. */
  channelReadReceipt?: { seen: boolean; anchorId: string | null } | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const grouped: { label: string; items: MessengerViewMessage[] }[] = [];
  let currentLabel = '';
  for (const msg of messages) {
    const label = messengerDateLabel(msg.timestamp);
    if (label !== currentLabel) {
      currentLabel = label;
      grouped.push({ label, items: [] });
    }
    const lastGroup = grouped[grouped.length - 1];
    if (lastGroup) lastGroup.items.push(msg);
  }

  const placeholder =
    active.type === 'channel'
      ? channelRow
        ? `Message ${channelRow.name.startsWith('#') ? channelRow.name : `#${channelRow.name}`}`
        : 'Message this channel'
      : `Message ${dmTitle}`;

  const showChannelReceiptOffviewBanner =
    active.type === 'channel' &&
    channelReadReceipt?.seen === true &&
    channelReadReceipt.anchorId != null &&
    messages.length > 0 &&
    !messages.some((m) => m.id === channelReadReceipt.anchorId);

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-3">
        {active.type === 'channel' && (
          <>
            <Hash size={18} className="text-[#E5A84B]" />
            <div>
              <h2 className="text-sm font-semibold text-black">
                {channelRow
                  ? channelRow.name.startsWith('#')
                    ? channelRow.name.slice(1)
                    : channelRow.name
                  : 'Channel'}
              </h2>
              <p className="text-xs text-black/40">
                {channelRow ? channelSubtitle(channelRow) : 'Loading channel…'}
              </p>
            </div>
          </>
        )}
        {active.type === 'dm' && (
          <>
            <Avatar initials={dmInitials} />
            <div>
              <h2 className="text-sm font-semibold text-black">{dmTitle}</h2>
              <p className="text-xs text-black/40">Direct message</p>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messagesLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-black/40">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-black/30">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <DateDivider label={group.label} />
              {group.items.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  readReceiptLabel={readReceiptLabelForMessage(
                    active,
                    msg,
                    dmReadReceiptMessageId,
                    channelReadReceipt ?? null,
                  )}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-black/[0.06] px-5 py-3">
        {showChannelReceiptOffviewBanner ? (
          <p className="mb-2 text-xs text-black/45">{MESSENGER_CHANNEL_RECEIPT_OFFVIEW_HINT}</p>
        ) : null}
        {remoteTypingHint ? (
          <p className="mb-2 text-xs text-black/45 italic">{remoteTypingHint}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              const v = e.target.value;
              onNewMessageChange(v);
              if (v.trim().length > 0) onComposerTypingIntent?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend && !sendDisabled) onSend();
              }
            }}
            placeholder={placeholder}
            disabled={!canSend}
            className="flex-1 rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-3 py-2 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend || sendDisabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E5A84B] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <input
          type="text"
          value={attachmentDraft}
          onChange={(e) => onAttachmentDraftChange(e.target.value)}
          placeholder="Optional Drive FileAsset IDs, comma separated"
          disabled={!canSend}
          className="mt-2 w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-3 py-1.5 text-xs text-black placeholder:text-black/30 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none disabled:opacity-50"
        />
        {!canSend && (
          <p className="mt-2 text-xs text-black/40">You do not have permission to send messages.</p>
        )}
      </div>
    </div>
  );
}
