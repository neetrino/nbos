'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useMemo, type ReactNode } from 'react';

import {
  FILTER_BAR_CONTROL_PILL,
  FILTER_BAR_FILTER_TRIGGER_ACTIVE,
  FILTER_BAR_GLOBAL_CLEAR_BUTTON_TONE,
  FILTER_BAR_GLOBAL_CLEAR_SLOT,
  FILTER_BAR_INNER_GAP,
  FILTER_BAR_SEARCH_ACTIVE,
  FILTER_BAR_TOOLBAR_SURFACE,
} from './filter-bar-constants';
import { LIST_SEARCH_INPUT_PROPS } from './list-search-input-props';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  /** When false, no “All …” option; value falls back to the first option if unset. */
  includeAllOption?: boolean;
}

export interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  actions?: ReactNode;
  className?: string;
}

function filterBarHasActiveQuery(
  search: string,
  filters: FilterConfig[] | undefined,
  filterValues: Record<string, string>,
): boolean {
  if (search.trim().length > 0) return true;
  return (
    filters?.some((f) => {
      if (f.includeAllOption === false) return false;
      const v = filterValues[f.key];
      return Boolean(v) && v !== 'all';
    }) ?? false
  );
}

interface FilterBarFilterSelectProps {
  filter: FilterConfig;
  filterValues: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
}

function FilterBarSearchField({
  search,
  onSearchChange,
  searchPlaceholder,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
}) {
  const searchActive = search.trim().length > 0;

  return (
    <div className="relative min-h-10 min-w-0 flex-1 md:min-w-[240px]">
      <Search
        size={16}
        className={cn(
          'pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2',
          searchActive ? 'text-blue-600/80 dark:text-blue-300/90' : 'text-muted-foreground',
        )}
      />
      <Input
        {...LIST_SEARCH_INPUT_PROPS}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        role="searchbox"
        className={cn(
          'w-full pl-10',
          FILTER_BAR_CONTROL_PILL,
          searchActive && FILTER_BAR_SEARCH_ACTIVE,
        )}
      />
    </div>
  );
}

function FilterBarFilterSelect({
  filter,
  filterValues,
  onFilterChange,
}: FilterBarFilterSelectProps) {
  const showAll = filter.includeAllOption !== false;
  const fallback = filter.options[0]?.value ?? '';
  const value = showAll
    ? filterValues[filter.key] || 'all'
    : (filterValues[filter.key] ?? fallback);

  const items = useMemo(
    () => [
      ...(showAll ? [{ value: 'all' as const, label: `All ${filter.label}` }] : []),
      ...filter.options.map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [filter.label, filter.options, showAll],
  );

  const resolveTriggerLabel = (selected: string | null) => {
    const resolved = selected ?? value;
    const row = items.find((i) => i.value === resolved);
    return row?.label ?? filter.label;
  };

  const isNarrowingFilter = showAll ? value !== 'all' : value !== fallback;

  return (
    <Select value={value} onValueChange={(v) => onFilterChange?.(filter.key, v as string)}>
      <SelectTrigger
        className={cn(
          'w-[min(100%,160px)] sm:w-[160px]',
          FILTER_BAR_CONTROL_PILL,
          isNarrowingFilter && FILTER_BAR_FILTER_TRIGGER_ACTIVE,
        )}
      >
        <SelectValue placeholder={filter.label}>{resolveTriggerLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface FilterBarInnerProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters: FilterConfig[] | undefined;
  filterValues: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  actions?: ReactNode;
  hasActiveFilters: boolean;
}

function FilterBarInner({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  filterValues,
  onFilterChange,
  onClearFilters,
  actions,
  hasActiveFilters,
}: FilterBarInnerProps) {
  const reserveGlobalClearSlot = Boolean(onClearFilters);

  const handleToolbarClear = () => {
    onClearFilters?.();
    if (search.trim().length > 0) {
      onSearchChange('');
    }
  };

  return (
    <div className={FILTER_BAR_INNER_GAP}>
      <FilterBarSearchField
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
      />

      {reserveGlobalClearSlot ? (
        <div className={FILTER_BAR_GLOBAL_CLEAR_SLOT}>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('size-9 shrink-0 rounded-full', FILTER_BAR_GLOBAL_CLEAR_BUTTON_TONE)}
              onClick={handleToolbarClear}
              aria-label="Clear active filters and search"
            >
              <X className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}

      {filters?.map((filter) => (
        <FilterBarFilterSelect
          key={filter.key}
          filter={filter}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
        />
      ))}

      {actions}
    </div>
  );
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  filterValues = {},
  onFilterChange,
  onClearFilters,
  actions,
  className,
}: FilterBarProps) {
  const hasActiveQuery = filterBarHasActiveQuery(search, filters, filterValues);

  return (
    <div className={cn(FILTER_BAR_TOOLBAR_SURFACE, className)}>
      <FilterBarInner
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        actions={actions}
        hasActiveFilters={hasActiveQuery}
      />
    </div>
  );
}
