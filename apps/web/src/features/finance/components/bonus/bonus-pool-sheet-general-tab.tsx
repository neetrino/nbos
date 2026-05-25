'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { BonusPoolFillBar } from '@/features/finance/components/bonus/bonus-pool-fill-bar';
import { BonusPoolRiskBadges } from '@/features/finance/components/bonus/bonus-pool-risk-badges';
import { BonusPoolSheetScopeLinks } from '@/features/finance/components/bonus/bonus-pool-sheet-scope-links';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { bonusPoolHasOverFunding } from '@/features/finance/constants/bonus-pool-status-ui';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import { bonusPoolFundedAmount } from '@/features/finance/utils/bonus-pool-display-metrics';
import type { BonusPoolRiskFlag, BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function SnapshotTile({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass?: string;
}) {
  return (
    <div className="border-border bg-muted/20 rounded-xl border px-3 py-2.5">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className={cn('mt-1 text-base font-semibold tabular-nums', accentClass)}>{value}</p>
    </div>
  );
}

export function BonusPoolSheetGeneralTab({
  pool,
  orderCodes,
  riskFlags,
  paymentCount,
  releaseCount,
  onOpenTab,
}: {
  pool: BonusProductPoolRow;
  orderCodes: string[];
  riskFlags: BonusPoolRiskFlag[];
  paymentCount: number;
  releaseCount: number;
  onOpenTab: (tab: 'funding' | 'bonuses') => void;
}) {
  return (
    <div className="space-y-5">
      <BonusPoolFillBar row={pool} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Client funding
          </p>
          <div className="grid grid-cols-2 gap-2">
            <SnapshotTile
              label="Received"
              value={formatBonusPoolMoney(pool.ledgerReceivedAmount)}
            />
            <SnapshotTile
              label="Funded"
              value={formatBonusPoolMoney(String(bonusPoolFundedAmount(pool)))}
            />
            <SnapshotTile
              label="Available (cash)"
              value={formatBonusPoolMoney(pool.ledgerAvailableFunding)}
            />
            <SnapshotTile
              label="Over funding"
              value={formatBonusPoolMoney(pool.ledgerOverFundingAmount)}
            />
            <SnapshotTile label="Payments" value={String(paymentCount)} />
          </div>
          <button
            type="button"
            onClick={() => onOpenTab('funding')}
            className="text-primary text-xs font-medium hover:underline"
          >
            View client payments
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Team bonuses
          </p>
          <div className="grid grid-cols-2 gap-2">
            <SnapshotTile label="Planned" value={formatBonusPoolMoney(pool.ledgerPlannedAmount)} />
            <SnapshotTile
              label="Remaining"
              value={formatBonusPoolMoney(pool.ledgerRemainingAmount)}
              accentClass="text-amber-700 dark:text-amber-400"
            />
            <SnapshotTile
              label="Released"
              value={formatBonusPoolMoney(pool.ledgerReleasedAmount)}
              accentClass="text-teal-700 dark:text-teal-400"
            />
            <SnapshotTile
              label="Paid"
              value={formatBonusPoolMoney(pool.sumPaidAmount)}
              accentClass="text-emerald-700 dark:text-emerald-400"
            />
          </div>
          <button
            type="button"
            onClick={() => onOpenTab('bonuses')}
            className="text-primary text-xs font-medium hover:underline"
          >
            {pool.entryCount} bonus entr{pool.entryCount === 1 ? 'y' : 'ies'} · {releaseCount}{' '}
            release{releaseCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>

      <BonusPoolSheetScopeLinks pool={pool} orderCodes={orderCodes} />

      {riskFlags.length > 0 ? <BonusPoolRiskBadges flags={riskFlags} /> : null}

      {bonusPoolHasOverFunding(pool) ? (
        <p className="text-destructive text-xs">
          Released bonuses exceed client money received — review before payroll attach.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={bonusBoardHref(pool.projectId)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
        >
          Open bonus board
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
