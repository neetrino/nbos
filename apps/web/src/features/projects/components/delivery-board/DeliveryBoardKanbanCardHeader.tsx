import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import type { DealTypePresentation } from '@/lib/deal-type-visual';
import { DeliveryCardReadinessPanel } from './DeliveryCardReadinessPanel';
import { DELIVERY_BOARD_CARD_KIND_ICON_CLASS } from './delivery-board-card-ui.constants';

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
  const Icon = visual.Icon;

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`${DELIVERY_BOARD_CARD_KIND_ICON_CLASS} ${visual.iconWrapClassName}`}
        title={visual.label}
      >
        <Icon size={18} aria-hidden />
      </span>
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
