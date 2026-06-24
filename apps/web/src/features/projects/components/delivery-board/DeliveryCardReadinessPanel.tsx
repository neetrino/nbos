import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import type { DealTypePresentation } from '@/lib/deal-type-visual';
import { isDeliveryHoldExpired } from '@/features/projects/constants/projects';
import { getDeliveryBoardCardChrome } from './delivery-board-card-chrome';
import { cn } from '@/lib/utils';

function readinessHoldLabel(lifecycle: DeliveryLifecycleProjection): string | null {
  if (lifecycle.workStatus !== 'ON_HOLD') return null;
  return isDeliveryHoldExpired(lifecycle) ? 'Hold expired' : 'On hold';
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
  const holdLabel = readinessHoldLabel(lifecycle);

  return (
    <div className="shrink-0 text-center">
      <p className="text-foreground text-sm leading-none font-bold tabular-nums">{fractionLabel}</p>
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
  );
}
