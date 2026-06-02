'use client';

import { Button } from '@/components/ui/button';
import { NbosMonthPicker } from '@/components/shared/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  filterAllOptionLabel,
  resolveFilterSelectLabel,
  resolveFilterSelectValue,
  type FilterConfig,
} from '../FilterBar';

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
  if (filter.fieldType === 'month') {
    const raw = filterValues[filter.key]?.trim() ?? '';
    const monthValue = raw && raw !== 'all' ? raw : '';
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs font-medium">{filter.label}</span>
        <NbosMonthPicker
          value={monthValue}
          onChange={(next) => {
            onFilterChange(filter.key, next.length > 0 ? next : 'all');
          }}
          className="w-full"
          aria-label={filter.label}
          placeholder="Select month…"
        />
      </label>
    );
  }

  const showAll = filter.includeAllOption !== false;
  const value = resolveFilterSelectValue(filter, filterValues);
  const triggerLabel = resolveFilterSelectLabel(filter, value);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{filter.label}</span>
      <Select value={value} onValueChange={(v) => onFilterChange(filter.key, v as string)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={filter.label}>{triggerLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showAll ? <SelectItem value="all">{filterAllOptionLabel(filter)}</SelectItem> : null}
          {filter.options.map((opt) => (
            <SelectItem key={`${filter.key}-${opt.value}`} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
