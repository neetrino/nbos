'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import type { DealTypePresentation } from '@/lib/deal-type-visual';
import { getDeliveryBoardCardChrome } from './delivery-board-card-chrome';
import { translateDeliveryHoldStatusLabel } from './delivery-board-message-keys';
import { cn } from '@/lib/utils';

export function DeliveryCardReadinessPanel({
  lifecycle,
  visual,
}: {
  lifecycle: DeliveryLifecycleProjection;
  visual: DealTypePresentation;
}) {
  const t = useTranslations('deliveryBoard');
  if (lifecycle.isTerminal || !lifecycle.stage) return null;

  const chrome = getDeliveryBoardCardChrome(visual);
  const readiness = lifecycle.currentStageReadiness;
  const completed = readiness?.completed ?? 0;
  const total = readiness?.total ?? 0;
  const hasCounts = readiness != null && total > 0;
  const fractionLabel = hasCounts ? `${completed}/${total}` : '—';
  const holdLabel = translateDeliveryHoldStatusLabel(lifecycle, t);

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums',
          visual.headerBadgeClassName,
        )}
      >
        {fractionLabel}
      </span>
      {holdLabel ? (
        <p className={cn('text-[10px] leading-none font-medium', chrome.readinessAccentTextClass)}>
          {holdLabel}
        </p>
      ) : null}
    </div>
  );
}
