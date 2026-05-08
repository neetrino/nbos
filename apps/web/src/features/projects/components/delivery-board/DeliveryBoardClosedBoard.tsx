import { ProjectDeliveryBoardCard } from './ProjectDeliveryBoardCard';
import type { BoardAction } from './project-delivery-board-actions';
import {
  getItemId,
  getItemKey,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';
import type { ProductBoardTab } from './ProjectDeliveryBoardContextLinks';

export function DeliveryBoardClosedBoard({
  items,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
  onOpenDetails,
  displayMode = 'full',
}: {
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
  displayMode?: 'full' | 'closedCompact';
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
        onOpenProductTab={onOpenProductTab}
        onBoardAction={onBoardAction}
        onCancel={onCancel}
        onOpenDetails={onOpenDetails}
        displayMode={displayMode}
      />
      <ClosedGroup
        title="Cancelled"
        items={cancelledItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onOpenProductTab={onOpenProductTab}
        onBoardAction={onBoardAction}
        onCancel={onCancel}
        onOpenDetails={onOpenDetails}
        displayMode={displayMode}
      />
    </div>
  );
}

function ClosedGroup({
  title,
  items,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
  onOpenDetails,
  displayMode,
}: {
  title: string;
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
  displayMode: 'full' | 'closedCompact';
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
            displayMode={displayMode}
            onOpenProduct={onOpenProduct}
            onOpenProductTab={onOpenProductTab}
            onOpenDetails={onOpenDetails ? () => onOpenDetails(item) : undefined}
            onMoveNext={() => onBoardAction(item, 'MOVE_NEXT')}
            onResume={() => onBoardAction(item, 'RESUME')}
            onComplete={() => onBoardAction(item, 'COMPLETE')}
            onCancel={() => onCancel(item)}
          />
        ))}
      </div>
    </div>
  );
}
