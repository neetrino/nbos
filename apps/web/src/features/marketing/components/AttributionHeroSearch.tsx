'use client';

import { IntegratedSearchFilters } from '@/components/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ATTRIBUTION_STATUS_FILTER_ALL,
  type AttributionStatusOption,
} from '@/features/marketing/constants/marketing-attribution-filters';

/** Match default `SelectTrigger` height (`h-10`). */
const STATUS_SELECT_CLASS = 'h-10 w-[11.5rem] shrink-0';

type AttributionHeroSearchProps = {
  search: string;
  onSearchChange: (search: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  statusOptions: AttributionStatusOption[];
};

export function AttributionHeroSearch({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
}: AttributionHeroSearchProps) {
  const selectValue = status || ATTRIBUTION_STATUS_FILTER_ALL;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="min-w-0 flex-1">
        <IntegratedSearchFilters
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search leads or deals by name, code, source…"
        />
      </div>
      <Select
        value={selectValue}
        onValueChange={(value) =>
          onStatusChange(value === ATTRIBUTION_STATUS_FILTER_ALL || !value ? '' : value)
        }
      >
        <SelectTrigger className={STATUS_SELECT_CLASS} aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ATTRIBUTION_STATUS_FILTER_ALL}>All statuses</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
