'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchHit } from '@/lib/api/search';
import { GlobalSearchHighlightText } from './GlobalSearchHighlightText';
import { GlobalSearchEntityIcon } from './GlobalSearchEntityIcon';
import { formatGlobalSearchDate } from './global-search-presenters';

interface GlobalSearchResultRowProps {
  hit: SearchHit;
  query: string;
  selected: boolean;
  onSelect: (hit: SearchHit) => void;
  onHover: (index: number) => void;
  index: number;
}

export function GlobalSearchResultRow({
  hit,
  query,
  selected,
  onSelect,
  onHover,
  index,
}: GlobalSearchResultRowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onMouseEnter={() => onHover(index)}
      onClick={() => onSelect(hit)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
        selected ? 'bg-muted/80' : 'hover:bg-muted/55',
      )}
    >
      <GlobalSearchEntityIcon entityType={hit.entityType} withTile />
      <span className="min-w-0 flex-1">
        <span className="text-foreground block truncate text-sm font-medium">
          <GlobalSearchHighlightText text={hit.title} query={query} />
        </span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">{hit.subtitle}</span>
      </span>
      <span className="text-muted-foreground/80 shrink-0 text-xs tabular-nums">
        {formatGlobalSearchDate(hit.occurredAt)}
      </span>
    </button>
  );
}

interface GlobalSearchResultsProps {
  items: SearchHit[];
  query: string;
  loading: boolean;
  selectedIndex: number;
  onSelect: (hit: SearchHit) => void;
  onHover: (index: number) => void;
}

export function GlobalSearchResults({
  items,
  query,
  loading,
  selectedIndex,
  onSelect,
  onHover,
}: GlobalSearchResultsProps) {
  if (loading && items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full min-h-full items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Searching…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full min-h-full items-center justify-center text-sm">
        No results found.
      </div>
    );
  }

  return (
    <ul role="listbox" className="space-y-0.5 px-2 py-1.5">
      {items.map((hit, index) => (
        <li key={`${hit.entityType}-${hit.id}`}>
          <GlobalSearchResultRow
            hit={hit}
            query={query}
            selected={selectedIndex === index}
            onSelect={onSelect}
            onHover={onHover}
            index={index}
          />
        </li>
      ))}
    </ul>
  );
}
