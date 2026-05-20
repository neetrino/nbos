'use client';

import { cn } from '@/lib/utils';
import { KANBAN_COLUMN_LEFT_RULE_CLASS } from '@/components/shared/kanban/kanban-column-surface';
import { ProjectDeliveryBoardCard } from './ProjectDeliveryBoardCard';
import { DELIVERY_TERMINAL_COLUMN_COLORS } from './delivery-terminal-kanban.constants';
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
}: {
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
}) {
  const doneItems = items.filter((item) => getItemLifecycle(item)?.resolution === 'DONE');
  const cancelledItems = items.filter((item) => getItemLifecycle(item)?.resolution === 'CANCELLED');

  if (doneItems.length === 0 && cancelledItems.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">No closed delivery items.</p>
    );
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col overflow-hidden">
      <div
        className={cn(
          'flex h-full min-h-0 w-full flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap',
          'sm:items-stretch',
        )}
      >
        <TerminalColumn
          title="Done"
          hex={DELIVERY_TERMINAL_COLUMN_COLORS.DONE}
          items={doneItems}
          showLeftRule={false}
          busyItemId={busyItemId}
          onOpenProduct={onOpenProduct}
          onOpenProductTab={onOpenProductTab}
          onBoardAction={onBoardAction}
          onCancel={onCancel}
          onOpenDetails={onOpenDetails}
        />
        <TerminalColumn
          title="Cancelled"
          hex={DELIVERY_TERMINAL_COLUMN_COLORS.CANCELLED}
          items={cancelledItems}
          showLeftRule
          busyItemId={busyItemId}
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

function TerminalColumn({
  title,
  hex,
  items,
  showLeftRule,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
  onOpenDetails,
}: {
  title: string;
  hex: string;
  items: DeliveryBoardItem[];
  showLeftRule: boolean;
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
}) {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.substring(0, 2), 16);
  const g = parseInt(raw.substring(2, 4), 16);
  const b = parseInt(raw.substring(4, 6), 16);
  const textColor = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000' : '#fff';
  const countBg = textColor === '#fff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)';

  return (
    <div
      className={cn(
        'mx-2 flex min-h-0 min-w-[288px] flex-1 flex-col sm:max-w-[calc(50%-0.375rem)] sm:min-w-[calc(50%-0.375rem)] sm:flex-none sm:basis-[calc(50%-0.375rem)]',
        'lg:max-w-none lg:min-w-[288px] lg:flex-1 lg:basis-0',
      )}
    >
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {showLeftRule ? <div className={KANBAN_COLUMN_LEFT_RULE_CLASS} aria-hidden /> : null}
        <div
          className="mb-3 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5"
          style={{ backgroundColor: hex }}
        >
          <span className="min-w-0 truncate text-sm font-bold" style={{ color: textColor }}>
            {title}
          </span>
          <span
            className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums"
            style={{ backgroundColor: countBg, color: textColor }}
          >
            {items.length}
          </span>
        </div>
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pr-1">
          <div className="flex min-h-full min-w-0 flex-col space-y-3 pb-3">
            {items.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-xs">No cards</p>
            ) : (
              items.map((item) => (
                <ProjectDeliveryBoardCard
                  key={getItemKey(item)}
                  item={item}
                  isActionBusy={busyItemId === getItemId(item)}
                  kanbanMinimal
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
      </div>
    </div>
  );
}
