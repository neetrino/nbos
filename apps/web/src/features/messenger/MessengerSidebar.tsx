import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from './messenger-sidebar.constants';
import type { MessengerActiveView } from './messenger-active-view';

/** @deprecated Legacy flat Channels/DM sidebar — replaced by L1/L2 Internal Messenger panels. */
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
}: {
  channels: MessengerSidebarChannel[];
  dmPeers: MessengerSidebarDmPeer[];
  active: MessengerActiveView | null;
  onSelect: (v: MessengerActiveView) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const q = search.toLowerCase();
  const filteredChannels = channels.filter((c) => c.listLabel.toLowerCase().includes(q));
  const filteredDm = dmPeers.filter((u) => u.name.toLowerCase().includes(q));

  return (
    <aside className="flex min-h-0 w-72 shrink-0 flex-col border-r border-black/[0.06] bg-white">
      <div className="flex-1 overflow-y-auto px-2">
        <p className="px-2 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
          Channels
        </p>
        {filteredChannels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => onSelect({ type: 'conversation', id: ch.id })}
            className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
              active?.id === ch.id ? 'bg-[#E5A84B]/15' : 'hover:bg-black/[0.04]'
            }`}
          >
            <span className="truncate">{ch.listLabel}</span>
            <SidebarUnreadBadge count={ch.unreadCount ?? 0} />
          </button>
        ))}
        <p className="px-2 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
          Direct
        </p>
        {filteredDm.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect({ type: 'conversation', id: user.id, peerEmployeeId: user.id })}
            className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
              active?.peerEmployeeId === user.id ? 'bg-[#E5A84B]/15' : 'hover:bg-black/[0.04]'
            }`}
          >
            <span className="truncate">{user.name}</span>
            <SidebarUnreadBadge count={user.unreadCount ?? 0} />
          </button>
        ))}
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search…"
        className="m-3 rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-3 py-1.5 text-sm"
      />
    </aside>
  );
}
