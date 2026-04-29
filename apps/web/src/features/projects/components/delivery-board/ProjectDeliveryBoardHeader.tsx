import { Button } from '@/components/ui/button';
import type {
  DeliveryBoardKindFilter,
  DeliveryBoardStatusFilter,
} from './project-delivery-board-model';

const KIND_FILTERS: Array<{ value: DeliveryBoardKindFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PRODUCT', label: 'Products' },
  { value: 'EXTENSION', label: 'Extensions' },
];

const STATUS_FILTERS: Array<{ value: DeliveryBoardStatusFilter; label: string }> = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ALL', label: 'All' },
];

interface ProjectDeliveryBoardHeaderProps {
  activeCount: number;
  closedCount: number;
  kindFilter: DeliveryBoardKindFilter;
  statusFilter: DeliveryBoardStatusFilter;
  onKindFilterChange: (filter: DeliveryBoardKindFilter) => void;
  onStatusFilterChange: (filter: DeliveryBoardStatusFilter) => void;
}

export function ProjectDeliveryBoardHeader({
  activeCount,
  closedCount,
  kindFilter,
  statusFilter,
  onKindFilterChange,
  onStatusFilterChange,
}: ProjectDeliveryBoardHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Delivery Board</h2>
          <p className="text-muted-foreground text-xs">
            Product and Extension cards grouped by canonical delivery stage.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="bg-secondary rounded-full px-2 py-1">{activeCount} active</span>
          <span className="bg-secondary rounded-full px-2 py-1">{closedCount} closed</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterGroup
          filters={STATUS_FILTERS}
          value={statusFilter}
          onChange={onStatusFilterChange}
        />
        <FilterGroup filters={KIND_FILTERS} value={kindFilter} onChange={onKindFilterChange} />
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  filters,
  value,
  onChange,
}: {
  filters: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={value === filter.value ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
