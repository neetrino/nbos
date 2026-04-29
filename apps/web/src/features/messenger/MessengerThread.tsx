import { useEffect, useRef } from 'react';
import { Hash, Send } from 'lucide-react';
import type { MessengerChannelRow } from '@/lib/api/messenger';
import { formatMessengerTime, messengerDateLabel } from './messenger-format';
import type { MessengerViewMessage } from './messenger-message-mapper';
import type { MessengerActiveView } from './messenger-active-view';

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

function MessageBubble({ message }: { message: MessengerViewMessage }) {
  return (
    <div className="group flex gap-3 px-5 py-1.5 hover:bg-black/[0.02]">
      <Avatar initials={message.initials} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-black">{message.senderName}</span>
          <span className="text-xs text-black/35">{formatMessengerTime(message.timestamp)}</span>
        </div>
        <p className="text-sm leading-relaxed text-black/75">{message.content}</p>
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
  onSend,
  canSend,
  sendDisabled,
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
  onSend: () => void;
  canSend: boolean;
  sendDisabled: boolean;
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
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-black/[0.06] px-5 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
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
        {!canSend && (
          <p className="mt-2 text-xs text-black/40">You do not have permission to send messages.</p>
        )}
      </div>
    </div>
  );
}
