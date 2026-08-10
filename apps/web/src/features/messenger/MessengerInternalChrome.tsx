import {
  MESSENGER_INTERNAL_TABS,
  type MessengerInternalTabId,
} from './messenger-internal.constants';

export function MessengerInternalChrome({
  zone,
  onZoneChange,
  tab,
  onTabChange,
  messageSearch,
  onMessageSearchChange,
}: {
  zone: 'internal' | 'external';
  onZoneChange: (zone: 'internal' | 'external') => void;
  tab: MessengerInternalTabId;
  onTabChange: (tab: MessengerInternalTabId) => void;
  messageSearch: string;
  onMessageSearchChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-black/[0.06] bg-white px-4 py-2">
      <div className="flex rounded-lg bg-[#F5F5F0] p-0.5">
        <button
          type="button"
          onClick={() => onZoneChange('internal')}
          className={`rounded-md px-3 py-1 text-xs font-semibold ${
            zone === 'internal' ? 'bg-white text-black shadow-sm' : 'text-black/45'
          }`}
        >
          Internal
        </button>
        <button
          type="button"
          onClick={() => onZoneChange('external')}
          className={`rounded-md px-3 py-1 text-xs font-semibold ${
            zone === 'external' ? 'bg-white text-black shadow-sm' : 'text-black/45'
          }`}
        >
          External
        </button>
      </div>
      {zone === 'internal' ? (
        <div className="flex flex-wrap gap-1">
          {MESSENGER_INTERNAL_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                tab === t.id ? 'bg-[#E5A84B]/20 text-black' : 'text-black/45 hover:bg-black/[0.04]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="ml-auto w-56">
        <input
          type="search"
          value={messageSearch}
          onChange={(e) => onMessageSearchChange(e.target.value)}
          placeholder="Search messages…"
          className="w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-3 py-1.5 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
        />
      </div>
    </div>
  );
}
