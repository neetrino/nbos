import { Hash, Search } from 'lucide-react';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import type { MessengerSearchResultRow } from '@/lib/api/messenger';
import type { MessengerActiveView } from './messenger-active-view';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from './messenger-sidebar.constants';

export interface MessengerSidebarChannel {
  id: string;
  listLabel: string;
  unreadCount?: number;
}

export interface MessengerSidebarDmPeer {
  id: string;
  name: string;
  initials: string;
  online: boolean;
  unreadCount?: number;
}

function SidebarUnreadBadge({ count }: { count: number }) {
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

export function MessengerSidebar({
  channels,
  dmPeers,
  active,
  onSelect,
  search,
  onSearchChange,
  searchResults,
  onSelectSearchResult,
}: {
  channels: MessengerSidebarChannel[];
  dmPeers: MessengerSidebarDmPeer[];
  active: MessengerActiveView | null;
  onSelect: (v: MessengerActiveView) => void;
  search: string;
  onSearchChange: (v: string) => void;
  searchResults: MessengerSearchResultRow[];
  onSelectSearchResult: (result: MessengerSearchResultRow) => void;
}) {
  const q = search.toLowerCase();
  const filteredChannels = channels.filter((c) => c.listLabel.toLowerCase().includes(q));
  const filteredDm = dmPeers.filter((u) => u.name.toLowerCase().includes(q));

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-black/[0.06] bg-white">
      <div className="p-3">
        <div className="relative">
          <Search size={15} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/30" />
          <input
            {...LIST_SEARCH_INPUT_PROPS}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            role="searchbox"
            className="w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] py-1.5 pr-3 pl-8 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {searchResults.length > 0 && (
          <>
            <p className="px-2 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
              Search Results
            </p>
            {searchResults.slice(0, 6).map((result) => (
              <button
                key={result.messageId}
                type="button"
                onClick={() => onSelectSearchResult(result)}
                className="mb-0.5 w-full rounded-lg px-2 py-1.5 text-left text-xs text-black/60 hover:bg-black/[0.03]"
              >
                <span className="block truncate font-medium text-black/75">
                  {result.senderName}
                </span>
                <span className="line-clamp-2">{result.content}</span>
              </button>
            ))}
          </>
        )}

        <p className="px-2 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
          Channels
        </p>
        {filteredChannels.map((ch) => {
          const isActive = active?.type === 'channel' && active.id === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onSelect({ type: 'channel', id: ch.id })}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                isActive
                  ? 'bg-[#E5A84B]/10 font-medium text-black'
                  : 'text-black/60 hover:bg-black/[0.03]'
              }`}
            >
              <Hash size={15} className={isActive ? 'text-[#E5A84B]' : 'text-black/30'} />
              <span className="min-w-0 flex-1 truncate">{ch.listLabel}</span>
              <SidebarUnreadBadge count={ch.unreadCount ?? 0} />
            </button>
          );
        })}

        <p className="px-2 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
          Direct Messages
        </p>
        {filteredDm.map((user) => {
          const isActive = active?.type === 'dm' && active.userId === user.id;
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect({ type: 'dm', userId: user.id })}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                isActive
                  ? 'bg-[#E5A84B]/10 font-medium text-black'
                  : 'text-black/60 hover:bg-black/[0.03]'
              }`}
            >
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <span className="text-[10px] font-medium">{user.initials}</span>
                <span
                  className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-white ${
                    user.online ? 'bg-emerald-400' : 'bg-black/20'
                  }`}
                />
              </span>
              <span className="min-w-0 flex-1 truncate">{user.name}</span>
              <SidebarUnreadBadge count={user.unreadCount ?? 0} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
