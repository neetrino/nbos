'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DeliveryLifecycleProjection, FullProject } from '@/lib/api/projects';
import { ProjectDeliveryBoardCard } from './delivery-board/ProjectDeliveryBoardCard';
import { runBoardAction, type BoardAction } from './delivery-board/project-delivery-board-actions';
import {
  ACTIVE_DELIVERY_STAGES,
  DELIVERY_STAGE_LABELS,
  filterBoardItems,
  getActiveBoardItems,
  getBoardItems,
  getClosedBoardItems,
  getItemId,
  getItemKey,
  getItemLifecycle,
  type DeliveryBoardItem,
  type DeliveryBoardKindFilter,
  type DeliveryBoardStatusFilter,
} from './delivery-board/project-delivery-board-model';

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

interface ProjectDeliveryBoardProps {
  project: FullProject;
  onOpenProduct: (productId: string) => void;
  onRefresh: () => void | Promise<void>;
}

export function ProjectDeliveryBoard({
  project,
  onOpenProduct,
  onRefresh,
}: ProjectDeliveryBoardProps) {
  const [kindFilter, setKindFilter] = useState<DeliveryBoardKindFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<DeliveryBoardStatusFilter>('ACTIVE');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const boardItems = filterBoardItems(getBoardItems(project), kindFilter, statusFilter);
  const activeItems = getActiveBoardItems(boardItems);
  const closedItems = getClosedBoardItems(boardItems);

  const handleBoardAction = async (item: DeliveryBoardItem, action: BoardAction) => {
    const itemId = getItemId(item);
    setBusyItemId(itemId);
    try {
      await runBoardAction(item, action);
      await onRefresh();
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <section className="space-y-4">
      <DeliveryBoardHeader
        activeCount={activeItems.length}
        closedCount={closedItems.length}
        kindFilter={kindFilter}
        statusFilter={statusFilter}
        onKindFilterChange={setKindFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <div className="grid gap-3 xl:grid-cols-4">
        {ACTIVE_DELIVERY_STAGES.map((stage) => (
          <DeliveryStageColumn
            key={stage}
            stage={stage}
            items={activeItems.filter((item) => getItemLifecycle(item)?.stage === stage)}
            busyItemId={busyItemId}
            onOpenProduct={onOpenProduct}
            onBoardAction={handleBoardAction}
          />
        ))}
      </div>
      <ClosedDeliveryView
        items={closedItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onBoardAction={handleBoardAction}
      />
    </section>
  );
}

function DeliveryBoardHeader({
  activeCount,
  closedCount,
  kindFilter,
  statusFilter,
  onKindFilterChange,
  onStatusFilterChange,
}: {
  activeCount: number;
  closedCount: number;
  kindFilter: DeliveryBoardKindFilter;
  statusFilter: DeliveryBoardStatusFilter;
  onKindFilterChange: (filter: DeliveryBoardKindFilter) => void;
  onStatusFilterChange: (filter: DeliveryBoardStatusFilter) => void;
}) {
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

function DeliveryStageColumn({
  stage,
  items,
  busyItemId,
  onOpenProduct,
  onBoardAction,
}: {
  stage: Exclude<DeliveryLifecycleProjection['stage'], null>;
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
}) {
  return (
    <div className="bg-muted/30 border-border min-h-40 rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{DELIVERY_STAGE_LABELS[stage]}</h3>
        <span className="text-muted-foreground text-xs">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-xs">No cards</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ProjectDeliveryBoardCard
              key={getItemKey(item)}
              item={item}
              isActionBusy={busyItemId === getItemId(item)}
              onOpenProduct={onOpenProduct}
              onMoveNext={() => onBoardAction(item, 'MOVE_NEXT')}
              onResume={() => onBoardAction(item, 'RESUME')}
              onComplete={() => onBoardAction(item, 'COMPLETE')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClosedDeliveryView({
  items,
  busyItemId,
  onOpenProduct,
  onBoardAction,
}: {
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
}) {
  if (items.length === 0) return null;
  const doneItems = items.filter((item) => getItemLifecycle(item)?.resolution === 'DONE');
  const cancelledItems = items.filter((item) => getItemLifecycle(item)?.resolution === 'CANCELLED');

  return (
    <div className="bg-muted/20 border-border rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Closed</h3>
        <span className="text-muted-foreground text-xs">
          {doneItems.length} done · {cancelledItems.length} cancelled
        </span>
      </div>
      <ClosedGroup
        title="Done"
        items={doneItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onBoardAction={onBoardAction}
      />
      <ClosedGroup
        title="Cancelled"
        items={cancelledItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onBoardAction={onBoardAction}
      />
    </div>
  );
}

function ClosedGroup({
  title,
  items,
  busyItemId,
  onOpenProduct,
  onBoardAction,
}: {
  title: string;
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">{title}</p>
      <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <ProjectDeliveryBoardCard
            key={getItemKey(item)}
            item={item}
            isActionBusy={busyItemId === getItemId(item)}
            onOpenProduct={onOpenProduct}
            onMoveNext={() => onBoardAction(item, 'MOVE_NEXT')}
            onResume={() => onBoardAction(item, 'RESUME')}
            onComplete={() => onBoardAction(item, 'COMPLETE')}
          />
        ))}
      </div>
    </div>
  );
}
