'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterConfig } from '../FilterBar';

interface IntegratedSearchFilterPanelProps {
  filters: FilterConfig[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function IntegratedSearchFilterPanel({
  filters,
  filterValues,
  onFilterChange,
  onApply,
  onReset,
}: IntegratedSearchFilterPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="grid gap-3 sm:grid-cols-2">
        {filters.map((filter) => (
          <FilterField
            key={filter.key}
            filter={filter}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
          />
        ))}
      </div>
      <div className="border-border flex items-center justify-end gap-2 border-t pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
        <Button type="button" size="sm" onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function FilterField({
  filter,
  filterValues,
  onFilterChange,
}: {
  filter: FilterConfig;
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
}) {
  const showAll = filter.includeAllOption !== false;
  const fallback = filter.options[0]?.value ?? '';
  const value = showAll
    ? filterValues[filter.key] || 'all'
    : (filterValues[filter.key] ?? fallback);
  const items = [
    ...(showAll ? [{ value: 'all' as const, label: `All ${filter.label}` }] : []),
    ...filter.options.map((opt) => ({ value: opt.value, label: opt.label })),
  ];

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{filter.label}</span>
      <Select value={value} onValueChange={(v) => onFilterChange(filter.key, v as string)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={filter.label} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
