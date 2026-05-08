import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import { ProjectDeliveryBoardCard } from './ProjectDeliveryBoardCard';
import type { BoardAction } from './project-delivery-board-actions';
import {
  ACTIVE_DELIVERY_STAGES,
  DELIVERY_STAGE_LABELS,
  getItemId,
  getItemKey,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';
import type { ProductBoardTab } from './ProjectDeliveryBoardContextLinks';

export function DeliveryBoardActiveColumns({
  items,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
  onOpenDetails,
}: {
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-4">
      {ACTIVE_DELIVERY_STAGES.map((stage) => (
        <DeliveryStageColumn
          key={stage}
          stage={stage}
          items={items.filter((item) => getItemLifecycle(item)?.stage === stage)}
          busyItemId={busyItemId}
          onOpenProduct={onOpenProduct}
          onOpenProductTab={onOpenProductTab}
          onBoardAction={onBoardAction}
          onCancel={onCancel}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </div>
  );
}

function DeliveryStageColumn({
  stage,
  items,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
  onOpenDetails,
}: {
  stage: Exclude<DeliveryLifecycleProjection['stage'], null>;
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
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
              onOpenProductTab={onOpenProductTab}
              onOpenDetails={onOpenDetails ? () => onOpenDetails(item) : undefined}
              onMoveNext={() => onBoardAction(item, 'MOVE_NEXT')}
              onResume={() => onBoardAction(item, 'RESUME')}
              onComplete={() => onBoardAction(item, 'COMPLETE')}
              onCancel={() => onCancel(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
