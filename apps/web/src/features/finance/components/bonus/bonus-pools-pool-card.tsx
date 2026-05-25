'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import {
  bonusPoolFundingHealthUi,
  bonusPoolFundingRowAccentForRow,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import { StatusBadge } from '@/components/shared';
import { BonusPoolFillBar } from '@/features/finance/components/bonus/bonus-pool-fill-bar';
import {
  bonusPoolKindLabel,
  bonusPoolScopeTitle,
} from '@/features/finance/utils/bonus-pool-display';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

export function BonusPoolsPoolCard({
  row,
  onOpen,
}: {
  row: BonusProductPoolRow;
  onOpen: (row: BonusProductPoolRow) => void;
}) {
  const fundingUi = bonusPoolFundingHealthUi(resolveRowFundingHealth(row));
  const available = parseBonusPoolAmount(row.ledgerAvailableFunding);

  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className={cn(
        'border-border bg-card hover:bg-muted/30 w-full rounded-xl border px-3 py-2.5 text-left shadow-sm transition-all hover:shadow-md',
        bonusPoolFundingRowAccentForRow(row),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-foreground line-clamp-2 text-sm leading-snug font-semibold">
            {bonusPoolScopeTitle(row)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[10px] font-medium tracking-wide uppercase">
            {bonusPoolKindLabel(row.poolKind)} · {row.projectCode}
          </p>
        </div>
        <StatusBadge
          label={fundingUi.label}
          variant={fundingUi.variant}
          className="shrink-0 text-[10px]"
        />
      </div>

      <p className="text-foreground mt-2 text-base font-bold tabular-nums">
        {formatAmount(available)}
      </p>

      <div className="mt-2">
        <BonusPoolFillBar row={row} showLabel={false} />
      </div>
    </button>
  );
}
