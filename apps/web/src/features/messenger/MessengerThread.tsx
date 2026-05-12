import { useEffect, useRef } from 'react';
import { Hash } from 'lucide-react';
import type { MessengerChannelRow } from '@/lib/api/messenger';
import { messengerDateLabel } from './messenger-format';
import type { MessengerViewMessage } from './messenger-message-mapper';
import { MESSENGER_DM_READ_RECEIPT_LABEL } from './messenger-dm-read-receipt.util';
import { MESSENGER_CHANNEL_RECEIPT_OFFVIEW_HINT } from './messenger-channel-receipt-banner.constants';
import type { MessengerActiveView } from './messenger-active-view';
import {
  MESSENGER_THREAD_ATTACHMENT_INPUT_CLASS,
  MESSENGER_THREAD_HASH_ICON_CLASS,
} from './messenger-thread-ui.constants';
import {
  MessengerThreadAvatar,
  MessengerThreadComposerRow,
  MessengerThreadDateDivider,
  MessengerThreadMessageBubble,
} from './messenger-thread-primitives';

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
  hasMoreOlder,
  olderLoading,
  onLoadOlder,
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
  hasMoreOlder?: boolean;
  olderLoading?: boolean;
  onLoadOlder?: () => void | Promise<void>;
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId]);

  const handleLoadOlderClick = () => {
    if (!onLoadOlder || olderLoading || !hasMoreOlder) return;
    const el = scrollAreaRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    void (async () => {
      await onLoadOlder();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const node = scrollAreaRef.current;
          if (node) node.scrollTop += node.scrollHeight - prevScrollHeight;
        });
      });
    })();
  };

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
            <Hash size={18} className={MESSENGER_THREAD_HASH_ICON_CLASS} />
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
            <MessengerThreadAvatar initials={dmInitials} />
            <div>
              <h2 className="text-sm font-semibold text-black">{dmTitle}</h2>
              <p className="text-xs text-black/40">Direct message</p>
            </div>
          </>
        )}
      </div>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto py-4">
        {messagesLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-black/40">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-black/30">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {hasMoreOlder ? (
              <div className="flex justify-center px-5 pb-3">
                <button
                  type="button"
                  onClick={handleLoadOlderClick}
                  disabled={olderLoading}
                  className="rounded-full border border-black/[0.08] bg-[#F5F5F0] px-3 py-1 text-xs font-medium text-black/55 transition-colors hover:bg-black/[0.04] disabled:opacity-50"
                >
                  {olderLoading ? 'Loading older…' : 'Load older messages'}
                </button>
              </div>
            ) : null}
            {grouped.map((group) => (
              <div key={group.label}>
                <MessengerThreadDateDivider label={group.label} />
                {group.items.map((msg) => (
                  <MessengerThreadMessageBubble
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
            ))}
          </>
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
        <MessengerThreadComposerRow
          value={newMessage}
          onChange={onNewMessageChange}
          onSend={onSend}
          placeholder={placeholder}
          disabled={!canSend}
          sendDisabled={sendDisabled}
          onTypingIntent={onComposerTypingIntent}
        />
        <input
          type="text"
          value={attachmentDraft}
          onChange={(e) => onAttachmentDraftChange(e.target.value)}
          placeholder="Optional Drive FileAsset IDs, comma separated"
          disabled={!canSend}
          className={MESSENGER_THREAD_ATTACHMENT_INPUT_CLASS}
        />
        {!canSend && (
          <p className="mt-2 text-xs text-black/40">You do not have permission to send messages.</p>
        )}
      </div>
    </div>
  );
}
