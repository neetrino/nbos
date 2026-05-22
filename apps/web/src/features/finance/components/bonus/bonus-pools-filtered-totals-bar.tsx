'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusPoolsFilteredTotals } from '@/features/finance/utils/bonus-pools-filtered-totals';

export function BonusPoolsFilteredTotalsBar({ totals }: { totals: BonusPoolsFilteredTotals }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <TotalTile label="Pools" value={String(totals.poolCount)} />
      <TotalTile label="Planned" value={formatAmount(totals.planned)} />
      <TotalTile label="Released" value={formatAmount(totals.released)} />
      <TotalTile label="Available" value={formatAmount(totals.available)} />
      <TotalTile label="Paid (entries)" value={formatAmount(totals.paid)} />
      <TotalTile label="Over funding" value={String(totals.overFundingPools)} />
    </div>
  );
}

function TotalTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="text-foreground mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
