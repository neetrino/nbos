'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusPoolsProjectSummary } from '@/features/finance/utils/bonus-pools-project-summary';

export function BonusPoolsProjectSummaryBar({ summary }: { summary: BonusPoolsProjectSummary }) {
  return (
    <div className="bg-muted/30 border-border flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-xs">
      <span className="text-muted-foreground">
        <span className="text-foreground font-semibold tabular-nums">{summary.teamCount}</span>{' '}
        people (across pools)
      </span>
      <span className="text-muted-foreground">
        Received{' '}
        <span className="text-foreground font-semibold tabular-nums">
          {formatAmount(summary.received)}
        </span>
      </span>
      <span className="text-muted-foreground">
        Planned{' '}
        <span className="text-foreground font-semibold tabular-nums">
          {formatAmount(summary.planned)}
        </span>
      </span>
      <span className="text-muted-foreground">
        Remaining{' '}
        <span className="text-foreground font-semibold tabular-nums">
          {formatAmount(summary.remaining)}
        </span>
      </span>
      {summary.overFundingPools > 0 ? (
        <span className="text-destructive font-semibold">
          {summary.overFundingPools} pool{summary.overFundingPools === 1 ? '' : 's'} over funded
        </span>
      ) : null}
    </div>
  );
}
