import { ProjectDeliveryBoardCard } from './ProjectDeliveryBoardCard';
import type { BoardAction } from './project-delivery-board-actions';
import {
  getItemId,
  getItemKey,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';
import type { ProductBoardTab } from './ProjectDeliveryBoardContextLinks';

const CLOSED_COLUMN_MIN_HEIGHT_CLASS = 'min-h-[min(70vh,40rem)]';

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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ClosedColumn
          title="Done"
          items={doneItems}
          busyItemId={busyItemId}
          displayMode={displayMode}
          onOpenProduct={onOpenProduct}
          onOpenProductTab={onOpenProductTab}
          onBoardAction={onBoardAction}
          onCancel={onCancel}
          onOpenDetails={onOpenDetails}
        />
        <ClosedColumn
          title="Cancelled"
          items={cancelledItems}
          busyItemId={busyItemId}
          displayMode={displayMode}
          onOpenProduct={onOpenProduct}
          onOpenProductTab={onOpenProductTab}
          onBoardAction={onBoardAction}
          onCancel={onCancel}
          onOpenDetails={onOpenDetails}
        />
      </div>
    </div>
  );
}

function ClosedColumn({
  title,
  items,
  busyItemId,
  displayMode,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
  onOpenDetails,
}: {
  title: string;
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  displayMode: 'full' | 'closedCompact';
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
}) {
  return (
    <div
      className={`bg-muted/30 border-border flex ${CLOSED_COLUMN_MIN_HEIGHT_CLASS} flex-col rounded-xl border p-3`}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <span className="text-muted-foreground text-xs">{items.length}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-xs">No cards</p>
        ) : (
          items.map((item) => (
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
          ))
        )}
      </div>
    </div>
  );
}
