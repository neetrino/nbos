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
import { InternalConversationRow } from './InternalConversationRow';
import { InternalCreateMenu } from './InternalCreateMenu';

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
  onCreateGroup,
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
  onCreateGroup?: (title: string) => Promise<void>;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const selection = useConversationSelection(listRef, activeId);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#fafbfc]">
      <ListSearch
        search={search}
        filter={filter}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        createGroup={section === 'groups' ? onCreateGroup : undefined}
      />
      <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-2 pb-6">
        <ConversationSelectionCard rect={selection.rect} ready={selection.ready} />
        <ListStatus section={section} pending={listPending} empty={items.length === 0} />
        <ConversationRows
          items={items}
          activeId={activeId}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </div>
  );
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
  onSearchChange,
  onFilterChange,
  createGroup,
}: {
  search: string;
  filter: 'all' | 'unread' | 'mentions';
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'all' | 'unread' | 'mentions') => void;
  createGroup?: (title: string) => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white px-3">
        <Search size={16} className="shrink-0 text-[#94a3b8]" />
        <input
          {...LIST_SEARCH_INPUT_PROPS}
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          role="searchbox"
          className="w-full bg-transparent text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
        />
      </label>
      {createGroup ? <InternalCreateMenu onCreateGroup={createGroup} /> : null}
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
        pressed ? 'bg-[#eef2ff] text-[#4f46e5]' : 'text-[#64748b] hover:bg-white'
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
