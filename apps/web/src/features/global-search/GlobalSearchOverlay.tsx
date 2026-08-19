'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SearchHit, SearchQueryGroup } from '@/lib/api/search';
import {
  GLOBAL_SEARCH_HINT,
  GLOBAL_SEARCH_QUERY_GROUP_ALL,
  GLOBAL_SEARCH_SHORT_QUERY_HINT,
} from './global-search-constants';
import { GlobalSearchResults } from './GlobalSearchResults';
import { useGlobalSearchQuery } from './use-global-search-query';
import { useGlobalSearchEntitySheets } from './global-search-entity-sheets-context';

interface GlobalSearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function resetOverlayState(
  setQuery: (value: string) => void,
  setGroup: (value: SearchQueryGroup) => void,
  setSelectedIndex: (value: number) => void,
) {
  setQuery('');
  setGroup(GLOBAL_SEARCH_QUERY_GROUP_ALL);
  setSelectedIndex(0);
}

export function GlobalSearchOverlay({ open, onOpenChange }: GlobalSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { openSearchHit } = useGlobalSearchEntitySheets();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<SearchQueryGroup>(GLOBAL_SEARCH_QUERY_GROUP_ALL);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { loading, error, response } = useGlobalSearchQuery({ open, query, group });

  const items = response?.items ?? [];
  const availableGroups = response?.groups ?? [];
  const activeSelectedIndex = items.length === 0 ? 0 : Math.min(selectedIndex, items.length - 1);

  const tabs = useMemo(
    () => [{ id: GLOBAL_SEARCH_QUERY_GROUP_ALL, label: 'All' }, ...availableGroups],
    [availableGroups],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetOverlayState(setQuery, setGroup, setSelectedIndex);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);

  const navigateToHit = useCallback(
    (hit: SearchHit) => {
      close();
      openSearchHit(hit);
    },
    [close, openSearchHit],
  );

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (items.length === 0) return;
      setSelectedIndex((current) => (current + 1) % items.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (items.length === 0) return;
      setSelectedIndex((current) => (current - 1 + items.length) % items.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const hit = items[activeSelectedIndex];
      if (hit) navigateToHit(hit);
    }
  };

  const showHint = query.trim().length < 2;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onKeyDown={(event) => {
          if (event.key === 'Escape') close();
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Global search</DialogTitle>
          <DialogDescription>Search across modules you can access.</DialogDescription>
        </DialogHeader>

        <div className="border-border flex items-center gap-2 border-b px-4 py-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search…"
            className="h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8 shrink-0 px-2"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
            >
              Clear
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close search"
            onClick={close}
          >
            <X className="size-4" />
          </Button>
        </div>

        {tabs.length > 1 ? (
          <div className="border-border flex flex-wrap gap-2 border-b px-4 py-3">
            {tabs.map((tab) => {
              const active = group === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setGroup(tab.id);
                    setSelectedIndex(0);
                  }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="max-h-[min(28rem,calc(100vh-12rem))] overflow-y-auto">
          {error ? (
            <div className="text-destructive px-4 py-8 text-center text-sm">{error}</div>
          ) : showHint ? (
            <div className="text-muted-foreground px-4 py-10 text-center text-sm">
              <p>{GLOBAL_SEARCH_SHORT_QUERY_HINT}</p>
              <p className="mt-2 text-xs">{GLOBAL_SEARCH_HINT}</p>
            </div>
          ) : (
            <GlobalSearchResults
              items={items}
              query={query.trim()}
              loading={loading}
              selectedIndex={activeSelectedIndex}
              onSelect={navigateToHit}
              onHover={setSelectedIndex}
            />
          )}
        </div>

        {loading && items.length > 0 ? (
          <div className="border-border text-muted-foreground flex items-center gap-2 border-t px-4 py-2 text-xs">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Updating results…
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
