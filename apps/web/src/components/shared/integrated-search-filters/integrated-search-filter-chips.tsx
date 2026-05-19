'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveFilterSelectValue, type FilterConfig } from '../FilterBar';

export type ActiveFilterChip = {
  key: string;
  label: string;
};

export function buildActiveFilterChips(
  filters: FilterConfig[] | undefined,
  filterValues: Record<string, string>,
): ActiveFilterChip[] {
  if (!filters?.length) return [];
  return filters.flatMap((filter) => {
    const raw = resolveFilterSelectValue(filter, filterValues);
    const baseline =
      filter.includeAllOption !== false
        ? 'all'
        : (filter.defaultOptionValue ?? filter.options[0]?.value ?? '');
    if (raw === baseline) return [];
    const option = filter.options.find((o) => o.value === raw);
    const valueLabel = option?.label ?? raw;
    return [{ key: filter.key, label: `${filter.label}: ${valueLabel}` }];
  });
}

export function IntegratedSearchFilterChips({
  chips,
  onRemove,
}: {
  chips: ActiveFilterChip[];
  onRemove: (key: string) => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5 pe-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={cn(
            'bg-primary/15 text-primary inline-flex max-w-[12rem] items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium',
          )}
        >
          <span className="truncate">{chip.label}</span>
          <button
            type="button"
            className="hover:bg-primary/20 rounded p-0.5"
            aria-label={`Remove filter ${chip.label}`}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(chip.key);
            }}
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}
