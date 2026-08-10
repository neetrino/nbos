import { Search } from 'lucide-react';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import type { MessengerL1EntityRow } from '@/lib/api/messenger';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from './messenger-sidebar.constants';

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

export function MessengerL1Panel({
  entities,
  selectedEntityKey,
  onSelect,
  search,
  onSearchChange,
}: {
  entities: MessengerL1EntityRow[];
  selectedEntityKey: string | null;
  onSelect: (entity: MessengerL1EntityRow) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <aside className="flex min-h-0 w-56 shrink-0 flex-col border-r border-black/[0.06] bg-white">
      <div className="p-3">
        <div className="relative">
          <Search size={15} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/30" />
          <input
            {...LIST_SEARCH_INPUT_PROPS}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter…"
            role="searchbox"
            className="w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] py-1.5 pr-3 pl-8 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <p className="px-2 pt-1 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
          Entities
        </p>
        {entities.length === 0 ? (
          <p className="px-2 py-4 text-sm text-black/40">No entities</p>
        ) : (
          entities.map((entity) => {
            const key = `${entity.entityType}:${entity.entityId}`;
            const active = selectedEntityKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(entity)}
                className={`mb-0.5 flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                  active ? 'bg-[#E5A84B]/15 text-black' : 'text-black/80 hover:bg-black/[0.04]'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{entity.title}</span>
                  {entity.subtitle ? (
                    <span className="block truncate text-[11px] text-black/45">{entity.subtitle}</span>
                  ) : null}
                </span>
                <UnreadBadge count={entity.unreadCount} />
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
