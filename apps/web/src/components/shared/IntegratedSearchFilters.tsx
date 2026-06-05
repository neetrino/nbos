'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveFilterSelectValue, type FilterConfig } from './FilterBar';
import {
  buildActiveFilterChips,
  IntegratedSearchFilterChips,
} from './integrated-search-filters/integrated-search-filter-chips';
import {
  INTEGRATED_SEARCH_FILTER_PANEL_POSITION,
  INTEGRATED_SEARCH_FILTER_PANEL_SURFACE,
} from './integrated-search-filters/integrated-search-filter-constants';
import { IntegratedSearchFilterPanel } from './integrated-search-filters/integrated-search-filter-panel';
import { useHeroSearchExpansionState } from './page-hero/page-hero-toolbar-context';
import { LIST_SEARCH_INPUT_PROPS } from './list-search-input-props';

const EMPTY_FILTER_VALUES: Record<string, string> = {};

export interface IntegratedSearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function IntegratedSearchFilters({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  filterValues = EMPTY_FILTER_VALUES,
  onFilterChange,
  onClearAll,
  className,
}: IntegratedSearchFiltersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filterValues);
  const hasFilters = Boolean(filters?.length);

  const chips = useMemo(
    () => buildActiveFilterChips(filters, filterValues),
    [filters, filterValues],
  );
  const hasQuery = search.trim().length > 0 || chips.length > 0;

  useHeroSearchExpansionState({
    focused: searchFocused || panelOpen,
    panelOpen,
    hasQuery,
  });

  const panelFilterValues = panelOpen ? draftFilters : filterValues;

  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (containerRef.current?.contains(target)) return;
      if (target.closest('[data-slot="select-content"]')) return;
      setPanelOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [panelOpen]);

  const handleRemoveChip = (key: string) => {
    const filter = filters?.find((f) => f.key === key);
    if (!filter || !onFilterChange) return;
    onFilterChange(key, resolveFilterSelectValue(filter, {}));
  };

  const handleApply = () => {
    if (!onFilterChange || !filters) {
      setPanelOpen(false);
      return;
    }
    for (const filter of filters) {
      const next = draftFilters[filter.key];
      if (next !== undefined && next !== filterValues[filter.key]) {
        onFilterChange(filter.key, next);
      }
    }
    setPanelOpen(false);
  };

  const handleReset = () => {
    const cleared: Record<string, string> = {};
    filters?.forEach((f) => {
      cleared[f.key] = resolveFilterSelectValue(f, {});
    });
    setDraftFilters(cleared);
    onClearAll?.();
    onSearchChange('');
    setPanelOpen(false);
  };

  const openPanel = () => {
    setSearchFocused(true);
    if (!hasFilters || search.trim().length > 0) return;
    setDraftFilters(filterValues);
    setPanelOpen(true);
  };

  const handleSearchBlur = () => {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (containerRef.current?.contains(active)) return;
      if (active instanceof Element && active.closest('[data-slot="select-content"]')) return;
      setSearchFocused(false);
    }, 0);
  };

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    if (value.length > 0) setPanelOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full min-w-0', className)}>
      <div
        className={cn(
          'bg-muted/50 border-border/60 flex min-h-11 w-full min-w-0 items-center gap-2 rounded-2xl border px-2 shadow-none',
          hasQuery && 'ring-primary/30 ring-2',
          panelOpen && hasFilters && 'ring-primary/20 ring-2',
        )}
      >
        <IntegratedSearchFilterChips chips={chips} onRemove={handleRemoveChip} />
        <div className="relative min-w-0 flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            {...LIST_SEARCH_INPUT_PROPS}
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            onFocus={openPanel}
            onClick={openPanel}
            onBlur={handleSearchBlur}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            role="searchbox"
            aria-expanded={hasFilters ? panelOpen : undefined}
            aria-controls={hasFilters ? 'integrated-search-filter-panel' : undefined}
            className="h-9 border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
          />
        </div>
        {hasQuery ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full"
            aria-label="Clear search and filters"
            onClick={handleReset}
          >
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      {hasFilters && panelOpen ? (
        <div
          id="integrated-search-filter-panel"
          role="dialog"
          aria-label="Search filters"
          className={cn(
            INTEGRATED_SEARCH_FILTER_PANEL_POSITION,
            INTEGRATED_SEARCH_FILTER_PANEL_SURFACE,
          )}
        >
          <IntegratedSearchFilterPanel
            filters={filters ?? []}
            filterValues={panelFilterValues}
            onFilterChange={(key, value) => setDraftFilters((prev) => ({ ...prev, [key]: value }))}
            onApply={handleApply}
            onReset={handleReset}
          />
        </div>
      ) : null}
    </div>
  );
}
