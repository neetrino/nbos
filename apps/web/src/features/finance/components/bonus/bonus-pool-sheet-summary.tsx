'use client';

import Link from 'next/link';
import { FolderKanban, Hash } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { BonusPoolFillBar } from '@/features/finance/components/bonus/bonus-pool-fill-bar';
import { BonusPoolRiskBadges } from '@/features/finance/components/bonus/bonus-pool-risk-badges';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
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
import {
  formatBonusPoolMoney,
  parseBonusPoolAmount,
} from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolRiskFlag, BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function MetricTile({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass?: string;
}) {
  return (
    <div className="border-border bg-card rounded-xl border px-3 py-2.5">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className={cn('mt-1 text-base font-semibold tabular-nums', accentClass)}>{value}</p>
    </div>
  );
}

export function BonusPoolSheetSummary({
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
    <div className="space-y-4">
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

      <p className="text-foreground text-2xl font-bold tabular-nums">
        {formatAmount(available)}
        <span className="text-muted-foreground ml-2 text-sm font-normal">available funding</span>
      </p>

      <BonusPoolFillBar row={pool} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricTile label="Received" value={formatBonusPoolMoney(pool.ledgerReceivedAmount)} />
        <MetricTile label="Planned" value={formatBonusPoolMoney(pool.ledgerPlannedAmount)} />
        <MetricTile
          label="Released"
          value={formatBonusPoolMoney(pool.ledgerReleasedAmount)}
          accentClass="text-teal-700 dark:text-teal-400"
        />
        <MetricTile
          label="Remaining"
          value={formatBonusPoolMoney(pool.ledgerRemainingAmount)}
          accentClass="text-amber-700 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricTile
          label="Paid"
          value={formatBonusPoolMoney(pool.sumPaidAmount)}
          accentClass="text-emerald-700 dark:text-emerald-400"
        />
        <MetricTile
          label="Over funding"
          value={formatBonusPoolMoney(pool.ledgerOverFundingAmount)}
          accentClass={bonusPoolHasOverFunding(pool) ? 'text-red-700 dark:text-red-400' : undefined}
        />
      </div>

      {riskFlags.length > 0 ? <BonusPoolRiskBadges flags={riskFlags} /> : null}

      {bonusPoolHasOverFunding(pool) ? (
        <p className="text-destructive text-xs">
          Released bonuses exceed client money received — review before payroll attach.
        </p>
      ) : null}

      <div className="border-border bg-muted/30 space-y-2 rounded-xl border px-3 py-3 text-xs">
        <p className="text-foreground font-semibold">{bonusPoolScopeTitle(pool)}</p>
        <p className="text-muted-foreground flex items-center gap-1.5">
          <Hash size={12} className="shrink-0" aria-hidden />
          Orders {ordersLabel}
        </p>
        <p className="text-muted-foreground flex items-center gap-1.5">
          <FolderKanban size={12} className="shrink-0" aria-hidden />
          <Link
            href={`/projects/${pool.projectId}`}
            className="text-primary font-medium hover:underline"
          >
            {pool.projectCode} · {pool.projectName}
          </Link>
        </p>
        <Link
          href={bonusBoardHref(pool.projectId)}
          className="text-primary inline-block font-medium hover:underline"
        >
          Open bonus board for this project
        </Link>
      </div>
    </div>
  );
}
