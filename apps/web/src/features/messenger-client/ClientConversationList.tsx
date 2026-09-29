'use client';

import { useCallback, useRef } from 'react';
import { Globe, Search, Star } from 'lucide-react';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import {
  SlidingPillBackdrop,
  useSlidingPillIndicator,
} from '@/components/shared/page-hero/sliding-pill-indicator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from '@/features/messenger/messenger-sidebar.constants';
import type { MessengerClientConversationRow } from '@/lib/api/messenger-core-client';
import type {
  MessengerClientListFilter,
  MessengerClientProvider,
} from '@/lib/api/messenger-core-client';
import {
  CLIENT_MESSENGER_EMPTY_COPY,
  type ClientMessengerSectionId,
} from './client-messenger.constants';
import { uniqueAttentionLabels } from './client-attention-view';
import { clientConversationTitle, clientProviderLabel } from './client-messenger-section';

const FILTER_TAB_CLASS =
  'relative z-10 rounded-full px-2 py-1 text-[11px] font-medium transition-colors duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

const INBOX_FILTERS: Array<{ id: 'all' | MessengerClientListFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'needs_response', label: 'Needs response' },
  { id: 'assigned', label: 'Assigned' },
];

const ALL_PROVIDERS_ID = 'all';
const ALL_PROVIDERS_LABEL = 'All providers';
const PROVIDER_FILTER_LABEL = 'Filter by provider';

const PROVIDERS: Array<{ id: typeof ALL_PROVIDERS_ID | MessengerClientProvider; label: string }> = [
  { id: ALL_PROVIDERS_ID, label: ALL_PROVIDERS_LABEL },
  { id: 'INSTAGRAM', label: 'Instagram' },
  { id: 'FACEBOOK', label: 'Facebook' },
  { id: 'WHATSAPP', label: 'WhatsApp' },
];

function ClientProviderSelect({
  provider,
  onProviderChange,
}: {
  provider: '' | MessengerClientProvider;
  onProviderChange: (value: '' | MessengerClientProvider) => void;
}) {
  const label = PROVIDERS.find((item) => item.id === (provider || ALL_PROVIDERS_ID))?.label;
  return (
    <Select
      value={provider || ALL_PROVIDERS_ID}
      onValueChange={(next) => onProviderChange(providerFromSelect(next))}
    >
      <SelectTrigger size="sm" aria-label={PROVIDER_FILTER_LABEL} className="mt-2 w-full">
        <SelectValue>{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PROVIDERS.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ClientInboxFilterStrip({
  filter,
  onFilterChange,
}: {
  filter: 'all' | MessengerClientListFilter;
  onFilterChange: (value: 'all' | MessengerClientListFilter) => void;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const getActiveElement = useCallback(() => itemRefs.current.get(filter), [filter]);
  const { indicator, ready } = useSlidingPillIndicator(groupRef, getActiveElement, filter, false);

  return (
    <div ref={groupRef} className="relative mt-2 flex items-center gap-1">
      <SlidingPillBackdrop
        indicator={indicator}
        ready={ready}
        className="top-0 bottom-0 bg-teal-800/15"
      />
      {INBOX_FILTERS.map((item) => (
        <button
          key={item.id}
          ref={(node) => rememberFilter(itemRefs.current, item.id, node)}
          type="button"
          onClick={() => onFilterChange(item.id)}
          className={`${FILTER_TAB_CLASS} ${
            filter === item.id ? 'text-teal-950' : 'text-black/45 hover:text-teal-950'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function rememberFilter(
  refs: Map<string, HTMLButtonElement>,
  id: string,
  node: HTMLButtonElement | null,
) {
  if (node) refs.set(id, node);
  else refs.delete(id);
}

function providerFromSelect(value: string | null): '' | MessengerClientProvider {
  if (value === 'INSTAGRAM' || value === 'FACEBOOK' || value === 'WHATSAPP') return value;
  return '';
}

export function ClientConversationList({
  section,
  items,
  activeId,
  search,
  filter,
  provider,
  listPending = false,
  onSearchChange,
  onFilterChange,
  onProviderChange,
  onSelect,
  onToggleFavorite,
}: {
  section: ClientMessengerSectionId;
  items: MessengerClientConversationRow[];
  activeId: string | null;
  search: string;
  filter: 'all' | MessengerClientListFilter;
  provider: '' | MessengerClientProvider;
  listPending?: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'all' | MessengerClientListFilter) => void;
  onProviderChange: (value: '' | MessengerClientProvider) => void;
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
            placeholder="Search Client Messenger..."
            role="searchbox"
            className="w-full rounded-lg border border-teal-900/10 bg-[#F4F7F7] py-1.5 pr-3 pl-8 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-teal-800/25 focus:outline-none"
          />
        </div>
        <ClientInboxFilterStrip filter={filter} onFilterChange={onFilterChange} />
        <ClientProviderSelect provider={provider} onProviderChange={onProviderChange} />
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {listPending ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-black/40">
            Loading conversations…
          </p>
        ) : null}
        {!listPending && items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-black/40">
            {CLIENT_MESSENGER_EMPTY_COPY[section]}
          </p>
        ) : null}
        {items.map((row) => (
          <ClientListRow
            key={row.id}
            row={row}
            active={activeId === row.id}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </aside>
  );
}

function ClientListRow({
  row,
  active,
  onSelect,
  onToggleFavorite,
}: {
  row: MessengerClientConversationRow;
  active: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const title = clientConversationTitle(row.title, row.provider ?? null);
  const unread = row.unreadCount ?? 0;
  const attentionLabel = uniqueAttentionLabels(row.attention);
  return (
    <div
      className={`mb-0.5 flex items-center rounded-lg ${
        active ? 'bg-teal-800/10' : 'hover:bg-black/[0.03]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(row.id)}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm"
      >
        <Globe size={15} className={active ? 'text-teal-800' : 'text-black/30'} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-black">{title}</span>
          <span className="block truncate text-[11px] text-black/40">
            {clientProviderLabel(row.provider)}
            {attentionLabel ? ` · ${attentionLabel}` : ''}
            {row.lastMessagePreview ? ` · ${row.lastMessagePreview}` : ''}
          </span>
        </span>
        {unread > 0 ? (
          <span className="ml-auto min-w-[1.25rem] shrink-0 rounded-full bg-teal-800 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white tabular-nums">
            {unread > MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX
              ? `${MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX}+`
              : unread}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        aria-label={row.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        onClick={() => onToggleFavorite(row.id)}
        className="shrink-0 px-2 py-1.5 text-black/30 hover:text-teal-800"
      >
        <Star size={14} className={row.isFavorite ? 'fill-teal-800 text-teal-800' : ''} />
      </button>
    </div>
  );
}
