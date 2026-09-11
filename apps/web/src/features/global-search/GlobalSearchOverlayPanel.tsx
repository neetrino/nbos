'use client';

import type { SearchHit } from '@/lib/api/search';
import { GLOBAL_SEARCH_HINT, GLOBAL_SEARCH_SHORT_QUERY_HINT } from './global-search-constants';
import { GLOBAL_SEARCH_RECENT_HEADING } from './global-search-recent-storage';
import { GlobalSearchResults } from './GlobalSearchResults';

interface GlobalSearchOverlayPanelProps {
  error: string | null;
  showHint: boolean;
  recentHits: SearchHit[];
  items: SearchHit[];
  query: string;
  loading: boolean;
  selectedIndex: number;
  onSelect: (hit: SearchHit) => void;
  onHover: (index: number) => void;
}

export function GlobalSearchOverlayPanel({
  error,
  showHint,
  recentHits,
  items,
  query,
  loading,
  selectedIndex,
  onSelect,
  onHover,
}: GlobalSearchOverlayPanelProps) {
  if (error && !showHint) {
    return (
      <div className="text-destructive flex h-full items-center justify-center px-5 text-center text-sm">
        {error}
      </div>
    );
  }
  if (showHint && recentHits.length > 0) {
    return (
      <GlobalSearchResults
        items={recentHits}
        query=""
        loading={false}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
        onHover={onHover}
        heading={GLOBAL_SEARCH_RECENT_HEADING}
      />
    );
  }
  if (showHint) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center px-5 text-center text-sm">
        <p>{GLOBAL_SEARCH_SHORT_QUERY_HINT}</p>
        <p className="mt-2 text-xs">{GLOBAL_SEARCH_HINT}</p>
      </div>
    );
  }
  return (
    <GlobalSearchResults
      items={items}
      query={query.trim()}
      loading={loading}
      selectedIndex={selectedIndex}
      onSelect={onSelect}
      onHover={onHover}
    />
  );
}
