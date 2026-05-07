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
import type { ReactNode } from 'react';

import {
  FILTER_BAR_CONTROL_PILL,
  FILTER_BAR_INNER_GAP,
  FILTER_BAR_TOOLBAR_SURFACE,
} from './filter-bar-constants';

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
  return (
    <div className="relative min-h-10 min-w-0 flex-1 md:min-w-[240px]">
      <Search
        size={16}
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
      />
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className={cn('w-full pl-10', FILTER_BAR_CONTROL_PILL)}
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

  return (
    <Select value={value} onValueChange={(v) => onFilterChange?.(filter.key, v as string)}>
      <SelectTrigger className={cn('w-[min(100%,160px)] sm:w-[160px]', FILTER_BAR_CONTROL_PILL)}>
        <SelectValue placeholder={filter.label} />
      </SelectTrigger>
      <SelectContent>
        {showAll ? <SelectItem value="all">All {filter.label}</SelectItem> : null}
        {filter.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
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
  return (
    <div className={FILTER_BAR_INNER_GAP}>
      <FilterBarSearchField
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
      />

      {filters?.map((filter) => (
        <FilterBarFilterSelect
          key={filter.key}
          filter={filter}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
        />
      ))}

      {hasActiveFilters && onClearFilters ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-10 shrink-0 rounded-full px-3"
          onClick={onClearFilters}
        >
          <X size={14} />
          Clear
        </Button>
      ) : null}

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
