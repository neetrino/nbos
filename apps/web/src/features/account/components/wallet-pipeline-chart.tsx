import {
  WALLET_BONUS_PIPELINE_LABEL,
  WALLET_BONUS_PIPELINE_ORDER,
} from '@/features/finance/constants/employee-wallet-ui';
import { WALLET_PIPELINE_SEGMENT_CLASS } from '@/features/account/constants/wallet-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import type { WalletPipelineSegment } from '@/features/account/utils/wallet-overview-metrics';
import { cn } from '@/lib/utils';

interface WalletPipelineChartProps {
  segments: WalletPipelineSegment[];
}

export function WalletPipelineChart({ segments }: WalletPipelineChartProps) {
  const byGroup = new Map(segments.map((s) => [s.group, s]));
  const visible = WALLET_BONUS_PIPELINE_ORDER.filter((g) => (byGroup.get(g)?.amount ?? 0) > 0);
  const total = visible.reduce((sum, g) => sum + (byGroup.get(g)?.amount ?? 0), 0);

  if (total <= 0) {
    return (
      <p className="text-muted-foreground text-xs">
        No bonus pipeline entries yet — amounts appear when orders and releases are linked to you.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="bg-muted/60 flex h-2.5 w-full overflow-hidden rounded-full"
        role="img"
        aria-label="Bonus pipeline distribution"
      >
        {visible.map((group) => {
          const seg = byGroup.get(group)!;
          return (
            <div
              key={group}
              className={cn('h-full min-w-0 transition-all', WALLET_PIPELINE_SEGMENT_CLASS[group])}
              style={{ flexGrow: seg.amount, flexBasis: 0 }}
              title={`${WALLET_BONUS_PIPELINE_LABEL[group]}: ${formatAmount(seg.amount)}`}
            />
          );
        })}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {visible.map((group) => {
          const seg = byGroup.get(group)!;
          return (
            <li key={group} className="flex items-center gap-2 text-xs">
              <span
                className={cn('size-2 shrink-0 rounded-full', WALLET_PIPELINE_SEGMENT_CLASS[group])}
                aria-hidden
              />
              <span className="text-muted-foreground flex-1">
                {WALLET_BONUS_PIPELINE_LABEL[group]}
              </span>
              <span className="text-foreground font-medium tabular-nums">
                {formatAmount(seg.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
