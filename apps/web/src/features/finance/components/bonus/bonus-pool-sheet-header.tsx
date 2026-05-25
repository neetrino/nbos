'use client';

import { StatusBadge } from '@/components/shared';
import {
  bonusPoolFundingHealthUi,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import { bonusPoolSheetStatusUi } from '@/features/finance/constants/bonus-pool-status-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusPoolScopeTitle } from '@/features/finance/utils/bonus-pool-display';
import { bonusPoolFundedAmount } from '@/features/finance/utils/bonus-pool-display-metrics';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

/** Compact sheet header — title, ledger + funding status, funded pool amount. */
export function BonusPoolSheetHeader({ pool }: { pool: BonusProductPoolRow }) {
  const ledgerUi = bonusPoolSheetStatusUi(pool);
  const fundingUi = bonusPoolFundingHealthUi(resolveRowFundingHealth(pool));
  const funded = bonusPoolFundedAmount(pool);

  return (
    <div className="border-border bg-background shrink-0 space-y-2 border-b px-5 pt-4 pb-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-foreground min-w-0 text-xl font-bold tracking-tight">
          {bonusPoolScopeTitle(pool)}
        </h2>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <StatusBadge label={ledgerUi.label} variant={ledgerUi.variant} />
          <StatusBadge label={fundingUi.label} variant={fundingUi.variant} />
        </div>
      </div>
      <p className="text-foreground text-2xl font-bold tabular-nums">
        {formatAmount(funded)}
        <span className="text-muted-foreground ml-2 text-sm font-normal">funded</span>
      </p>
    </div>
  );
}
