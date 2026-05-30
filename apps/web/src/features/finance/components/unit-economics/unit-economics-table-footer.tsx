'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsFilteredTotals } from '@/features/finance/components/unit-economics/compute-unit-economics-filtered-totals';
import { unitEconomicsMarginClass } from '@/features/finance/components/unit-economics/unit-economics-money';
import { cn } from '@/lib/utils';

function FooterAmount({ value, className }: { value: number; className?: string }) {
  return (
    <td
      className={cn(
        'border-border bg-muted/30 border-t px-2 py-2 text-right text-[11px] font-semibold tabular-nums',
        className,
      )}
    >
      {formatAmount(value)}
    </td>
  );
}

export function UnitEconomicsOverviewFooter({ totals }: { totals: UnitEconomicsFilteredTotals }) {
  return (
    <tr>
      <td className="border-border bg-muted/30 border-t px-3 py-2 text-[11px] font-semibold">
        Filtered total
      </td>
      <FooterAmount value={totals.receivedAmount} />
      <FooterAmount value={totals.receivableAmount} />
      <FooterAmount value={totals.spentAmount} />
      <FooterAmount value={totals.remainingBonuses} />
      <FooterAmount value={totals.outCommittedAmount} />
      <FooterAmount
        value={totals.cashBalance}
        className={unitEconomicsMarginClass(totals.cashBalance)}
      />
      <FooterAmount
        value={totals.marginAfterCommitments}
        className={unitEconomicsMarginClass(totals.marginAfterCommitments)}
      />
    </tr>
  );
}

export function UnitEconomicsFundingFooter({ totals }: { totals: UnitEconomicsFilteredTotals }) {
  return (
    <tr>
      <td className="border-border bg-muted/30 border-t px-3 py-2 text-[11px] font-semibold">
        Filtered total
      </td>
      <FooterAmount value={totals.receivedAmount} />
      <FooterAmount
        value={totals.cashBalance}
        className={unitEconomicsMarginClass(totals.cashBalance)}
      />
      <FooterAmount
        value={totals.overReleaseAmount}
        className={totals.overReleaseAmount > 0 ? 'text-destructive' : undefined}
      />
      <FooterAmount value={totals.outCommittedAmount} />
    </tr>
  );
}

export function UnitEconomicsOutflowsFooter({ totals }: { totals: UnitEconomicsFilteredTotals }) {
  return (
    <tr>
      <td className="border-border bg-muted/30 border-t px-3 py-2 text-[11px] font-semibold">
        Filtered total
      </td>
      <FooterAmount value={totals.spentAmount} />
      <FooterAmount value={totals.remainingBonuses} />
      <FooterAmount value={totals.outCommittedAmount} />
      <FooterAmount value={totals.paidBonuses} />
    </tr>
  );
}

export function UnitEconomicsProfitabilityFooter({
  totals,
}: {
  totals: UnitEconomicsFilteredTotals;
}) {
  return (
    <tr>
      <td className="border-border bg-muted/30 border-t px-3 py-2 text-[11px] font-semibold">
        Filtered total
      </td>
      <FooterAmount
        value={totals.marginAfterCommitments}
        className={unitEconomicsMarginClass(totals.marginAfterCommitments)}
      />
      <FooterAmount
        value={totals.marginFact}
        className={unitEconomicsMarginClass(totals.marginFact)}
      />
      <FooterAmount value={totals.receivedAmount} />
      <FooterAmount value={totals.spentAmount} />
      <FooterAmount value={totals.remainingBonuses} />
      <FooterAmount value={totals.outCommittedAmount} />
    </tr>
  );
}
