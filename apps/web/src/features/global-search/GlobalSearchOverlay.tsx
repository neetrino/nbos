'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SearchHit, SearchQueryGroup } from '@/lib/api/search';
import {
  GLOBAL_SEARCH_QUERY_GROUP_ALL,
  GLOBAL_SEARCH_RESULTS_PANEL_CLASS,
} from './global-search-constants';
import { GlobalSearchOverlayPanel } from './GlobalSearchOverlayPanel';
import { localizeSearchGroupLabel } from './localize-search-group-label';
import { useGlobalSearchQuery } from './use-global-search-query';
import { useGlobalSearchEntitySheets } from './global-search-entity-sheets-context';
import {
  rememberGlobalSearchRecentHit,
  useGlobalSearchRecentHits,
} from './global-search-recent-storage';

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
  const t = useTranslations('search');
  const inputRef = useRef<HTMLInputElement>(null);
  const { openSearchHit } = useGlobalSearchEntitySheets();
  const recentHits = useGlobalSearchRecentHits();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<SearchQueryGroup>(GLOBAL_SEARCH_QUERY_GROUP_ALL);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { loading, error, response } = useGlobalSearchQuery({ open, query, group });

  const items = response?.items ?? [];
  const showHint = query.trim().length < 2;
  const displayedItems = showHint ? recentHits : items;
  const activeSelectedIndex =
    displayedItems.length === 0 ? 0 : Math.min(selectedIndex, displayedItems.length - 1);

  const tabs = useMemo(
    () => [
      {
        id: GLOBAL_SEARCH_QUERY_GROUP_ALL,
        label: t('groups.all'),
      },
      ...(response?.groups ?? []).map((groupTab) => ({
        id: groupTab.id,
        label: localizeSearchGroupLabel(groupTab.id, groupTab.label, t),
      })),
    ],
    [response?.groups, t],
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
      rememberGlobalSearchRecentHit(hit);
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
      if (displayedItems.length === 0) return;
      setSelectedIndex((current) => (current + 1) % displayedItems.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (displayedItems.length === 0) return;
      setSelectedIndex((current) => (current - 1 + displayedItems.length) % displayedItems.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const hit = displayedItems[activeSelectedIndex];
      if (hit) navigateToHit(hit);
    }
  };

  const clearQuery = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    inputRef.current?.focus();
  }, []);

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
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={t('placeholder')}
            className="text-foreground placeholder:text-muted-foreground/70 h-11 min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-9 shrink-0 rounded-full px-3.5 text-sm"
              onClick={clearQuery}
            >
              {t('clear')}
            </Button>
          ) : null}
          <span className="bg-border/70 h-5 w-px shrink-0" aria-hidden />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-9 shrink-0 rounded-full"
            aria-label={t('closeAria')}
            onClick={close}
          >
            <X className="size-4" />
          </Button>
        </div>

        {!showHint && tabs.length > 1 ? (
          <div className="flex flex-wrap gap-1.5 px-5 pt-1 pb-3">
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
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className={GLOBAL_SEARCH_RESULTS_PANEL_CLASS}>
          <GlobalSearchOverlayPanel
            error={error}
            showHint={showHint}
            recentHits={recentHits}
            items={items}
            query={query}
            loading={loading}
            selectedIndex={activeSelectedIndex}
            onSelect={navigateToHit}
            onHover={setSelectedIndex}
          />
        </div>

        <div
          className="text-muted-foreground flex h-9 items-center gap-2 px-5 text-xs"
          aria-live="polite"
        >
          {loading && items.length > 0 ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              {t('updating')}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
