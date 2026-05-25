'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/shared';
import { BonusPoolFillBar } from '@/features/finance/components/bonus/bonus-pool-fill-bar';
import { BonusPoolRiskBadges } from '@/features/finance/components/bonus/bonus-pool-risk-badges';
import {
  bonusPoolFundingHealthUi,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import {
  bonusPoolHasOverFunding,
  bonusPoolSheetStatusUi,
} from '@/features/finance/constants/bonus-pool-status-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  bonusPoolKindLabel,
  bonusPoolScopeTitle,
} from '@/features/finance/utils/bonus-pool-display';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolRiskFlag, BonusProductPoolRow } from '@/lib/api/bonus';

export function BonusPoolSheetHeader({
  pool,
  orderCodes,
  riskFlags,
}: {
  pool: BonusProductPoolRow;
  orderCodes: string[];
  riskFlags: BonusPoolRiskFlag[];
}) {
  const fundingUi = bonusPoolFundingHealthUi(resolveRowFundingHealth(pool));
  const ledgerUi = bonusPoolSheetStatusUi(pool);
  const available = parseBonusPoolAmount(pool.ledgerAvailableFunding);
  const ordersLabel =
    (orderCodes.length > 0 ? orderCodes : pool.orderCodes).join(', ') || pool.orderCode;

  return (
    <div className="border-border bg-background shrink-0 space-y-3 border-b px-5 pt-4 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground bg-muted rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          {bonusPoolKindLabel(pool.poolKind)}
        </span>
        <StatusBadge label={fundingUi.label} variant={fundingUi.variant} />
        <StatusBadge label={ledgerUi.label} variant={ledgerUi.variant} />
        <span className="text-muted-foreground text-xs tabular-nums">
          {pool.employeeCount} people · {pool.entryCount} entries
        </span>
      </div>

      <div>
        <h2 className="text-foreground text-xl font-bold tracking-tight">
          {bonusPoolScopeTitle(pool)}
        </h2>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {pool.projectCode} · {ordersLabel}
        </p>
      </div>

      <p className="text-foreground text-2xl font-bold tabular-nums">
        {formatAmount(available)}
        <span className="text-muted-foreground ml-2 text-sm font-normal">available funding</span>
      </p>

      <BonusPoolFillBar row={pool} />

      {riskFlags.length > 0 ? <BonusPoolRiskBadges flags={riskFlags} /> : null}

      {bonusPoolHasOverFunding(pool) ? (
        <p className="text-destructive text-xs">
          Released bonuses exceed client money received — review before payroll attach.
        </p>
      ) : null}

      <p className="text-muted-foreground text-xs">
        <Link
          href={`/projects/${pool.projectId}`}
          className="text-primary font-medium hover:underline"
        >
          {pool.projectName}
        </Link>
      </p>
    </div>
  );
}
