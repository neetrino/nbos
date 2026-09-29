'use client';

import { Pin } from 'lucide-react';
import { formatConversationListStamp } from '@/features/messenger/messenger-format';
import { initialsFromDisplayName } from '@/features/messenger/messenger-message-mapper';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from '@/features/messenger/messenger-sidebar.constants';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { conversationListTitle, conversationTypeBadge } from './internal-messenger-section';
import { PresenceDot, useEmployeeOnline } from './PresenceAvatar';

export function InternalConversationRow({
  row,
  active,
  onSelect,
  onToggleFavorite,
}: {
  row: MessengerCoreConversationRow;
  active: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const title = conversationListTitle(row.type, row.title, row.peerName ?? null);
  return (
    <div
      data-conversation-id={row.id}
      className={`relative z-10 mb-1 flex rounded-xl px-2 py-2.5 ${
        active ? '' : 'hover:bg-white/80'
      }`}
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
        <ConversationCopy row={row} title={title} />
      </button>
      <FavoritePin favorite={Boolean(row.isFavorite)} onToggle={() => onToggleFavorite(row.id)} />
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
  const initials = initialsFromDisplayName(title);
  const online = useEmployeeOnline(employeeId);
  const tone = direct
    ? 'rounded-full border border-[#fcd34d] bg-[#fef3c7] text-[#92400e]'
    : 'rounded-xl bg-[#e0e7ff] text-[#4338ca]';
  return (
    <span
      className={`relative mt-0.5 flex size-10 shrink-0 items-center justify-center text-xs ${tone}`}
    >
      {initials}
      <PresenceDot online={online} />
    </span>
  );
}

function ConversationCopy({ row, title }: { row: MessengerCoreConversationRow; title: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-[#0f172a]">{title}</span>
        <span className="shrink-0 text-[11px] text-[#94a3b8]">
          {formatConversationListStamp(row.lastMessageAt)}
        </span>
      </span>
      <span className="mt-0.5 block truncate text-xs text-[#64748b]">
        {row.lastMessagePreview ?? conversationTypeBadge(row.type)}
      </span>
      <span className="mt-1.5 flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] text-[#0f172a]">
          {conversationTypeBadge(row.type)}
        </span>
        <UnreadCount count={row.unreadCount ?? 0} />
      </span>
    </span>
  );
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
      className="mt-5 shrink-0 px-1 text-[#64748b]/70 hover:text-[#4f46e5]"
    >
      <Pin size={14} className={favorite ? 'fill-[#4f46e5] text-[#4f46e5]' : ''} />
    </button>
  );
}
