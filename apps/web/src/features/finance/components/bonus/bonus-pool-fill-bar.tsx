'use client';

import {
  bonusPoolFundingHealthUi,
  formatPoolFillPercent,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import { bonusPoolFundingFillPercent } from '@/features/finance/utils/bonus-pool-display-metrics';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

const FILL_TRACK = 'bg-muted h-2 w-full overflow-hidden rounded-full';

export function BonusPoolFillBar({
  row,
  className,
  showLabel = true,
}: {
  row: BonusProductPoolRow;
  className?: string;
  showLabel?: boolean;
}) {
  const health = resolveRowFundingHealth(row);
  const ui = bonusPoolFundingHealthUi(health);
  const fillPercent = bonusPoolFundingFillPercent(row);
  const pct = fillPercent ?? 0;
  const width = Math.min(100, Math.max(0, pct));

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showLabel ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Funding fill</span>
          <span className="font-semibold tabular-nums">{formatPoolFillPercent(fillPercent)}</span>
        </div>
      ) : null}
      <div
        className={FILL_TRACK}
        role="progressbar"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-[width]', ui.fillBarClass)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
