import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import type { DealTypePresentation } from '@/lib/deal-type-visual';
import { DeliveryCardReadinessPanel } from './DeliveryCardReadinessPanel';
import { getDeliveryBoardCardChrome } from './delivery-board-card-chrome';
import { DELIVERY_BOARD_CARD_ACCENT_BAR_CLASS } from './delivery-board-card-ui.constants';
import { cn } from '@/lib/utils';

export function DeliveryBoardKanbanCardHeader({
  title,
  metaLabel,
  visual,
  lifecycle,
}: {
  title: string;
  metaLabel: string | null;
  visual: DealTypePresentation;
  lifecycle: DeliveryLifecycleProjection | null;
}) {
  const chrome = getDeliveryBoardCardChrome(visual);

  return (
    <div className="flex items-start gap-2.5">
      <span
        className={cn(DELIVERY_BOARD_CARD_ACCENT_BAR_CLASS, chrome.readinessFillClass)}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-tight font-semibold">{title}</p>
        {metaLabel ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{metaLabel}</p>
        ) : null}
      </div>
      {lifecycle && !lifecycle.isTerminal && lifecycle.stage ? (
        <DeliveryCardReadinessPanel lifecycle={lifecycle} visual={visual} />
      ) : null}
    </div>
  );
}
