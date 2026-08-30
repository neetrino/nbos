'use client';

import { Hash, Search, Star, User } from 'lucide-react';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from '@/features/messenger/messenger-sidebar.constants';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import {
  INTERNAL_MESSENGER_EMPTY_COPY,
  type InternalMessengerSectionId,
} from './internal-messenger.constants';
import { conversationListTitle, conversationTypeBadge } from './internal-messenger-section';

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label =
    count > MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX
      ? `${MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX}+`
      : String(count);
  return (
    <span className="ml-auto min-w-[1.25rem] shrink-0 rounded-full bg-[#E5A84B] px-1.5 py-0.5 text-center text-[10px] font-semibold text-white tabular-nums">
      {label}
    </span>
  );
}

export function InternalConversationList({
  section,
  items,
  activeId,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onSelect,
  onToggleFavorite,
}: {
  section: InternalMessengerSectionId;
  items: MessengerCoreConversationRow[];
  activeId: string | null;
  search: string;
  filter: 'all' | 'unread' | 'mentions';
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'all' | 'unread' | 'mentions') => void;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <aside className="border-border bg-card flex min-h-0 w-72 shrink-0 flex-col border-r">
      <div className="p-3">
        <div className="relative">
          <Search size={15} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/30" />
          <input
            {...LIST_SEARCH_INPUT_PROPS}
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search Internal..."
            role="searchbox"
            className="w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] py-1.5 pr-3 pl-8 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
          />
        </div>
        <div className="mt-2 flex gap-1">
          {(['all', 'unread', 'mentions'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onFilterChange(value)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium capitalize ${
                filter === value
                  ? 'bg-[#E5A84B]/15 text-black'
                  : 'text-black/45 hover:bg-black/[0.04]'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-black/40">
            {INTERNAL_MESSENGER_EMPTY_COPY[section]}
          </p>
        ) : null}
        {items.map((row) => {
          const active = activeId === row.id;
          const title = conversationListTitle(row.type, row.title, row.peerName ?? null);
          return (
            <div
              key={row.id}
              className={`mb-0.5 flex items-center rounded-lg ${
                active ? 'bg-[#E5A84B]/10' : 'hover:bg-black/[0.03]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(row.id)}
                className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm"
              >
                {row.type === 'DIRECT' ? (
                  <User size={15} className={active ? 'text-[#E5A84B]' : 'text-black/30'} />
                ) : (
                  <Hash size={15} className={active ? 'text-[#E5A84B]' : 'text-black/30'} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-black">{title}</span>
                  <span className="block truncate text-[11px] text-black/40">
                    {conversationTypeBadge(row.type)}
                    {row.lastMessagePreview ? ` · ${row.lastMessagePreview}` : ''}
                  </span>
                </span>
                <UnreadBadge count={row.unreadCount ?? 0} />
              </button>
              <button
                type="button"
                aria-label={row.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                onClick={() => onToggleFavorite(row.id)}
                className="shrink-0 px-2 py-1.5 text-black/30 hover:text-[#E5A84B]"
              >
                <Star size={14} className={row.isFavorite ? 'fill-[#E5A84B] text-[#E5A84B]' : ''} />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
