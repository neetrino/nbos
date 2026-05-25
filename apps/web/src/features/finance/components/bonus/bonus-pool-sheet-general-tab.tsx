'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
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
  paymentCount,
  releaseCount,
  onOpenTab,
}: {
  pool: BonusProductPoolRow;
  paymentCount: number;
  releaseCount: number;
  onOpenTab: (tab: 'funding' | 'bonuses') => void;
}) {
  return (
    <div className="space-y-5">
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
              label="Over funding"
              value={formatBonusPoolMoney(pool.ledgerOverFundingAmount)}
            />
          </div>
          <button
            type="button"
            onClick={() => onOpenTab('funding')}
            className="text-primary text-xs font-medium hover:underline"
          >
            {paymentCount} client payment{paymentCount === 1 ? '' : 's'} · View funding
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
          </div>
          <button
            type="button"
            onClick={() => onOpenTab('bonuses')}
            className="text-primary text-xs font-medium hover:underline"
          >
            {pool.entryCount} bonus entr{pool.entryCount === 1 ? 'y' : 'ies'} · View bonuses
          </button>
        </div>
      </div>

      <div className="border-border bg-muted/20 grid grid-cols-2 gap-2 rounded-xl border px-3 py-3 sm:grid-cols-4">
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
        <SnapshotTile label="Releases" value={String(releaseCount)} />
        <SnapshotTile label="People" value={String(pool.employeeCount)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={bonusBoardHref(pool.projectId)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
        >
          Open bonus board
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
        <Link
          href="/finance/bonus-pools"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}
        >
          All bonus pools
        </Link>
      </div>
    </div>
  );
}
