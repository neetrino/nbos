'use client';

import { useRef, type ReactNode } from 'react';
import { Bookmark, MessageSquare, Search } from 'lucide-react';
import { ConversationSelectionCard, useConversationSelection } from './conversation-list-selection';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import {
  INTERNAL_MESSENGER_EMPTY_COPY,
  type InternalMessengerSectionId,
} from './internal-messenger.constants';
import { DirectEmployeeHits } from './DirectEmployeeHits';
import { conversationListTitle } from './internal-messenger-section';
import { InternalConversationRow } from './InternalConversationRow';

export function InternalConversationList({
  section,
  items,
  activeId,
  search,
  filter,
  listPending = false,
  onSearchChange,
  onFilterChange,
  onSelect,
  onToggleFavorite,
  selfId,
  onStartDirect,
}: {
  section: InternalMessengerSectionId;
  items: MessengerCoreConversationRow[];
  activeId: string | null;
  search: string;
  filter: 'all' | 'unread' | 'mentions';
  listPending?: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'all' | 'unread' | 'mentions') => void;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  selfId?: string;
  onStartDirect?: (employee: { id: string; name: string }) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const selection = useConversationSelection(listRef, activeId);
  const visibleItems = filterConversationsBySearch(items, search);
  return (
    <div className="bg-sidebar text-sidebar-foreground flex min-h-0 flex-1 flex-col">
      <ListSearch
        search={search}
        filter={filter}
        placeholder={section === 'direct' ? 'Search an employee' : 'Search'}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
      />
      <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto px-2 pb-6">
        <ConversationSelectionCard rect={selection.rect} ready={selection.ready} />
        {section === 'direct' && onStartDirect ? (
          <DirectEmployeeHits query={search} selfId={selfId} onOpen={onStartDirect} />
        ) : null}
        <ListStatus section={section} pending={listPending} empty={visibleItems.length === 0} />
        <ConversationRows
          items={visibleItems}
          activeId={activeId}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </div>
  );
}

function filterConversationsBySearch(
  items: MessengerCoreConversationRow[],
  search: string,
): MessengerCoreConversationRow[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;
  return items.filter((row) => {
    const title = conversationListTitle(row.type, row.title, row.peerName ?? null).toLowerCase();
    const preview = row.lastMessagePreview?.toLowerCase() ?? '';
    return title.includes(query) || preview.includes(query);
  });
}

function ConversationRows({
  items,
  activeId,
  onSelect,
  onToggleFavorite,
}: {
  items: MessengerCoreConversationRow[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const favorites = items.filter((row) => row.isFavorite);
  const recent = items.filter((row) => !row.isFavorite);
  return (
    <>
      {favorites.map((row, index) => (
        <InternalConversationRow
          key={row.id}
          row={row}
          active={activeId === row.id}
          showDivider={rowDividerVisible(
            row.id,
            index < favorites.length - 1 ? favorites[index + 1]?.id : undefined,
            activeId,
          )}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
      {favorites.length > 0 && recent.length > 0 ? <SectionLabel>Recent</SectionLabel> : null}
      {recent.map((row, index) => (
        <InternalConversationRow
          key={row.id}
          row={row}
          active={activeId === row.id}
          showDivider={rowDividerVisible(row.id, recent[index + 1]?.id, activeId)}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </>
  );
}

function rowDividerVisible(
  rowId: string,
  nextId: string | undefined,
  activeId: string | null,
): boolean {
  if (!nextId) return false;
  if (rowId === activeId || nextId === activeId) return false;
  return true;
}

function ListSearch({
  search,
  filter,
  placeholder,
  onSearchChange,
  onFilterChange,
}: {
  search: string;
  filter: 'all' | 'unread' | 'mentions';
  placeholder: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'all' | 'unread' | 'mentions') => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <label className="border-border bg-card flex h-9 min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          {...LIST_SEARCH_INPUT_PROPS}
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          role="searchbox"
          className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-xs focus:outline-none"
        />
      </label>
      <FilterToggle
        label="Unread"
        pressed={filter === 'unread'}
        onClick={() => onFilterChange(filter === 'unread' ? 'all' : 'unread')}
        icon={<MessageSquare size={18} />}
      />
      <FilterToggle
        label="Mentions"
        pressed={filter === 'mentions'}
        onClick={() => onFilterChange(filter === 'mentions' ? 'all' : 'mentions')}
        icon={<Bookmark size={18} />}
      />
    </div>
  );
}

function FilterToggle({
  label,
  pressed,
  onClick,
  icon,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-lg ${
        pressed
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-card hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  );
}

function ListStatus({
  section,
  pending,
  empty,
}: {
  section: InternalMessengerSectionId;
  pending: boolean;
  empty: boolean;
}) {
  if (pending) {
    return <p className="px-2 py-6 text-center text-xs text-[#94a3b8]">Loading conversations…</p>;
  }
  if (!empty) return null;
  return (
    <p className="px-2 py-6 text-center text-xs leading-relaxed text-[#94a3b8]">
      {INTERNAL_MESSENGER_EMPTY_COPY[section]}
    </p>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-2 pt-3 pb-1.5 text-[10px] tracking-[1px] text-[#94a3b8] uppercase">
      {children}
    </p>
  );
}
