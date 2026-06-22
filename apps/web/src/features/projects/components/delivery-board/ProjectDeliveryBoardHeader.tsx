import { SegmentedTabs } from '@/components/shared';
import { DeliveryBoardKindSegmented } from './DeliveryBoardKindSegmented';
import type {
  DeliveryBoardKindFilter,
  DeliveryBoardStatusFilter,
} from './project-delivery-board-model';

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
  /** When set, status chips are hidden (global Active tab locks to active pipeline). */
  hideStatusFilters?: boolean;
}

export function ProjectDeliveryBoardHeader({
  activeCount,
  closedCount,
  kindFilter,
  statusFilter,
  onKindFilterChange,
  onStatusFilterChange,
  hideStatusFilters = false,
}: ProjectDeliveryBoardHeaderProps) {
  const toolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="bg-secondary rounded-full px-2 py-1 text-xs">{activeCount} active</span>
      <span className="bg-secondary rounded-full px-2 py-1 text-xs">{closedCount} closed</span>
      <DeliveryBoardKindSegmented value={kindFilter} onValueChange={onKindFilterChange} />
    </div>
  );

  return (
    <div className="space-y-3">
      {hideStatusFilters ? (
        toolbar
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Delivery Board</h2>
            <p className="text-muted-foreground text-xs">
              Product and Extension cards grouped by canonical delivery stage.
            </p>
          </div>
          {toolbar}
        </div>
      )}
      {!hideStatusFilters ? (
        <SegmentedTabs
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={STATUS_FILTERS}
          ariaLabel="Delivery board status"
          className="w-fit"
          buttonClassName="px-3 py-2 text-xs"
        />
      ) : null}
    </div>
  );
}
