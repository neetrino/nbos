'use client';

import { CheckCheck, Pin } from 'lucide-react';
import { formatConversationListStamp } from '@/features/messenger/messenger-format';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from '@/features/messenger/messenger-sidebar.constants';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { conversationListTitle, conversationTypeBadge } from './internal-messenger-section';
import { MessengerPersonAvatar } from './MessengerPersonAvatar';

const SIDEBAR_SEEN_CHECK = 'text-[#0284c7]';
const SIDEBAR_UNSEEN_CHECK = 'text-[#475569]';

export function InternalConversationRow({
  row,
  active,
  showDivider = true,
  onSelect,
  onToggleFavorite,
}: {
  row: MessengerCoreConversationRow;
  active: boolean;
  showDivider?: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const title = conversationListTitle(row.type, row.title, row.peerName ?? null);
  const favorite = Boolean(row.isFavorite);
  return (
    <div
      data-conversation-id={row.id}
      className={`group relative z-10 flex items-stretch px-2 py-2.5 ${
        showDivider
          ? 'after:absolute after:right-2 after:bottom-0 after:left-[3.75rem] after:h-px after:bg-[#e2e8f0]/70'
          : ''
      } ${active ? '' : 'hover:bg-white/80'}`}
    >
      <button
        type="button"
        onClick={() => onSelect(row.id)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <ConversationMark
          title={title}
          direct={row.type === 'DIRECT'}
          employeeId={row.peerEmployeeId}
          pinned={favorite}
        />
        <ConversationBody row={row} title={title} />
      </button>
      <ConversationMeta
        row={row}
        favorite={favorite}
        onToggleFavorite={() => onToggleFavorite(row.id)}
      />
    </div>
  );
}

function ConversationMark({
  title,
  direct,
  employeeId,
  pinned,
}: {
  title: string;
  direct: boolean;
  employeeId: string | null | undefined;
  pinned: boolean;
}) {
  const fallback = direct ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e0e7ff] text-[#4338ca]';
  return (
    <span className="relative mt-0.5 shrink-0">
      <MessengerPersonAvatar
        employeeId={employeeId}
        label={title}
        sizeClassName="size-10"
        fallbackClassName={fallback}
        showPresence
        roundedClassName={direct ? 'rounded-full border border-[#fcd34d]' : 'rounded-xl'}
      />
      {pinned ? <PinnedBadge /> : null}
    </span>
  );
}

function PinnedBadge() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-0.5 -left-0.5 flex size-4 items-center justify-center rounded-full bg-[#4f46e5] text-white shadow-sm"
    >
      <Pin size={9} className="fill-white" />
    </span>
  );
}

function ConversationBody({ row, title }: { row: MessengerCoreConversationRow; title: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-xs text-[#0f172a]">{title}</span>
      <ConversationPreview row={row} />
      <span className="mt-1.5 flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] text-[#0f172a]">
          {conversationTypeBadge(row.type)}
        </span>
        <UnreadCount count={row.unreadCount ?? 0} />
      </span>
    </span>
  );
}

function ConversationMeta({
  row,
  favorite,
  onToggleFavorite,
}: {
  row: MessengerCoreConversationRow;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const stamp = formatConversationListStamp(row.lastMessageAt ?? row.createdAt);
  const showChecks = row.lastMessageMine === true;
  return (
    <span className="ml-2 flex shrink-0 flex-col items-end justify-between self-stretch">
      <span className="flex items-center gap-1">
        {stamp ? <span className="text-[11px] leading-none text-[#64748b]">{stamp}</span> : null}
        {showChecks ? (
          <CheckCheck
            size={14}
            aria-label={row.lastMessageSeen ? 'Seen' : 'Delivered'}
            className={row.lastMessageSeen ? SIDEBAR_SEEN_CHECK : SIDEBAR_UNSEEN_CHECK}
          />
        ) : null}
      </span>
      <FavoritePin favorite={favorite} onToggle={onToggleFavorite} />
    </span>
  );
}

function ConversationPreview({ row }: { row: MessengerCoreConversationRow }) {
  const preview = row.lastMessagePreview?.trim();
  const typeLabel = conversationTypeBadge(row.type);
  if (!preview || preview.toLowerCase() === typeLabel.toLowerCase()) return null;
  return <span className="mt-0.5 block truncate text-xs text-[#64748b]">{preview}</span>;
}

function UnreadCount({ count }: { count: number }) {
  if (count <= 0) return <span />;
  const label =
    count > MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX
      ? `${MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX}+`
      : String(count);
  return (
    <span className="rounded-full bg-[#4f46e5] px-1.5 py-0.5 text-[10px] text-white tabular-nums">
      {label}
    </span>
  );
}

function FavoritePin({ favorite, onToggle }: { favorite: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={favorite ? 'Remove from Favorites' : 'Add to Favorites'}
      onClick={onToggle}
      className={`rounded-md p-0.5 text-[#64748b]/70 transition-opacity hover:text-[#4f46e5] ${
        favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
      }`}
    >
      <Pin size={14} className={favorite ? 'fill-[#4f46e5] text-[#4f46e5]' : ''} />
    </button>
  );
}
