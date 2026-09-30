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
      className={`group relative z-10 flex items-stretch rounded-[17px] px-2 py-2.5 ${
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
        />
        <ConversationBody row={row} title={title} active={active} />
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
}: {
  title: string;
  direct: boolean;
  employeeId: string | null | undefined;
}) {
  const fallback = direct ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e0e7ff] text-[#4338ca]';
  return (
    <MessengerPersonAvatar
      employeeId={employeeId}
      label={title}
      sizeClassName="mt-0.5 size-10"
      fallbackClassName={fallback}
      showPresence
      roundedClassName={direct ? 'rounded-full border border-[#fcd34d]' : 'rounded-xl'}
    />
  );
}

function ConversationBody({
  row,
  title,
  active,
}: {
  row: MessengerCoreConversationRow;
  title: string;
  active: boolean;
}) {
  return (
    <span className="min-w-0 flex-1">
      <span
        className={`block truncate text-xs ${
          active ? 'font-semibold text-[#312e81]' : 'font-medium text-[#0f172a]'
        }`}
      >
        {title}
      </span>
      <ConversationPreview row={row} active={active} />
      <span className="mt-1.5 inline-flex">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            active ? 'bg-[#c7d2fe]/80 text-[#3730a3]' : 'bg-[#f1f5f9] text-[#0f172a]'
          }`}
        >
          {conversationTypeBadge(row.type)}
        </span>
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
  const unread = row.unreadCount ?? 0;
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
      <span className="flex items-center gap-1">
        <UnreadCount count={unread} />
        <FavoritePin favorite={favorite} onToggle={onToggleFavorite} />
      </span>
    </span>
  );
}

function ConversationPreview({
  row,
  active,
}: {
  row: MessengerCoreConversationRow;
  active: boolean;
}) {
  const preview = row.lastMessagePreview?.trim();
  const typeLabel = conversationTypeBadge(row.type);
  if (!preview || preview.toLowerCase() === typeLabel.toLowerCase()) return null;
  return (
    <span
      className={`mt-0.5 block truncate text-xs ${active ? 'text-[#4338ca]/80' : 'text-[#64748b]'}`}
    >
      {preview}
    </span>
  );
}

function UnreadCount({ count }: { count: number }) {
  if (count <= 0) return null;
  const label =
    count > MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX
      ? `${MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX}+`
      : String(count);
  return (
    <span
      aria-label={`${count} unread`}
      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#38bdf8] px-1.5 text-[11px] leading-none font-semibold text-[#0f172a] tabular-nums"
    >
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
