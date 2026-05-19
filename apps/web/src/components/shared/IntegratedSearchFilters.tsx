'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { FilterConfig } from './FilterBar';
import {
  buildActiveFilterChips,
  IntegratedSearchFilterChips,
} from './integrated-search-filters/integrated-search-filter-chips';
import { IntegratedSearchFilterPanel } from './integrated-search-filters/integrated-search-filter-panel';

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
  filterValues = {},
  onFilterChange,
  onClearAll,
  className,
}: IntegratedSearchFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filterValues);

  const chips = useMemo(
    () => buildActiveFilterChips(filters, filterValues),
    [filters, filterValues],
  );
  const hasQuery = search.trim().length > 0 || chips.length > 0;

  const handleOpenChange = (next: boolean) => {
    if (next) setDraftFilters(filterValues);
    setOpen(next);
  };

  const handleRemoveChip = (key: string) => {
    const filter = filters?.find((f) => f.key === key);
    if (!filter || !onFilterChange) return;
    const showAll = filter.includeAllOption !== false;
    onFilterChange(key, showAll ? 'all' : (filter.options[0]?.value ?? ''));
  };

  const handleApply = () => {
    if (!onFilterChange || !filters) {
      setOpen(false);
      return;
    }
    for (const filter of filters) {
      const next = draftFilters[filter.key];
      if (next !== undefined && next !== filterValues[filter.key]) {
        onFilterChange(filter.key, next);
      }
    }
    setOpen(false);
  };

  const handleReset = () => {
    const cleared: Record<string, string> = {};
    filters?.forEach((f) => {
      cleared[f.key] = f.includeAllOption !== false ? 'all' : (f.options[0]?.value ?? '');
    });
    setDraftFilters(cleared);
    onClearAll?.();
    onSearchChange('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div
        className={cn(
          'bg-muted/50 border-border/60 flex min-h-11 min-w-0 items-center gap-2 rounded-2xl border px-2 shadow-none',
          hasQuery && 'ring-primary/30 ring-2',
          className,
        )}
      >
        <IntegratedSearchFilterChips chips={chips} onRemove={handleRemoveChip} />
        <PopoverTrigger
          nativeButton={false}
          render={(props) => (
            <div {...props} className="relative min-w-0 flex-1">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                onFocus={() => {
                  if (filters?.length) setOpen(true);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
              />
            </div>
          )}
        />
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
      {filters?.length ? (
        <PopoverContent className="w-[min(100vw-2rem,28rem)] p-4" align="start">
          <IntegratedSearchFilterPanel
            filters={filters}
            filterValues={draftFilters}
            onFilterChange={(key, value) => setDraftFilters((prev) => ({ ...prev, [key]: value }))}
            onApply={handleApply}
            onReset={handleReset}
          />
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
