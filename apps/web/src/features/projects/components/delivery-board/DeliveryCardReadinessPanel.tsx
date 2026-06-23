import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import type { DealTypePresentation } from '@/lib/deal-type-visual';
import { isDeliveryHoldExpired } from '@/features/projects/constants/projects';
import { getDeliveryBoardCardChrome } from './delivery-board-card-chrome';
import {
  DELIVERY_BOARD_CARD_READINESS_PANEL_BASE_CLASS,
  DELIVERY_BOARD_CARD_READINESS_PANEL_MIN_WIDTH_PX,
} from './delivery-board-card-ui.constants';
import { cn } from '@/lib/utils';

function readinessHoldLabel(lifecycle: DeliveryLifecycleProjection): string | null {
  if (lifecycle.workStatus !== 'ON_HOLD') return null;
  return isDeliveryHoldExpired(lifecycle) ? 'Hold expired' : 'On hold';
}

function readinessPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function DeliveryCardReadinessPanel({
  lifecycle,
  visual,
}: {
  lifecycle: DeliveryLifecycleProjection;
  visual: DealTypePresentation;
}) {
  if (lifecycle.isTerminal || !lifecycle.stage) return null;

  const chrome = getDeliveryBoardCardChrome(visual);
  const readiness = lifecycle.currentStageReadiness;
  const completed = readiness?.completed ?? 0;
  const total = readiness?.total ?? 0;
  const hasCounts = readiness != null && total > 0;
  const fractionLabel = hasCounts ? `${completed}/${total}` : '—';
  const percent = hasCounts ? readinessPercent(completed, total) : 0;
  const holdLabel = readinessHoldLabel(lifecycle);

  return (
    <div
      className={cn(DELIVERY_BOARD_CARD_READINESS_PANEL_BASE_CLASS, chrome.readinessPanelClass)}
      style={{ minWidth: `${DELIVERY_BOARD_CARD_READINESS_PANEL_MIN_WIDTH_PX}px` }}
    >
      <div className="flex flex-col items-center text-center">
        <p className="text-foreground text-sm leading-none font-bold tabular-nums">
          {fractionLabel}
        </p>
        {holdLabel ? (
          <p
            className={cn(
              'mt-0.5 text-[10px] leading-none font-medium',
              chrome.readinessAccentTextClass,
            )}
          >
            {holdLabel}
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          'mt-1.5 h-1.5 w-full overflow-hidden rounded-full',
          chrome.readinessTrackClass,
        )}
      >
        <div
          className={cn('h-full rounded-full transition-[width]', chrome.readinessFillClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p
        className={cn(
          'mt-0.5 text-center text-[10px] font-semibold tabular-nums',
          chrome.readinessAccentTextClass,
        )}
      >
        {hasCounts ? `${percent}%` : '—'}
      </p>
    </div>
  );
}
