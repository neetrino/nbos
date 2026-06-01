'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsFilteredTotals } from '@/features/finance/components/unit-economics/compute-unit-economics-filtered-totals';
import {
  unitEconomicsGroupAmountClass,
  unitEconomicsGroupDataCellClass,
  type UnitEconomicsColumnGroup,
} from '@/features/finance/components/unit-economics/unit-economics-column-groups';
import { cn } from '@/lib/utils';

function FooterLabelCell() {
  return (
    <td className="border-border bg-muted/30 border-t px-3 py-2 text-[11px] font-semibold">
      Filtered total
    </td>
  );
}

function FooterAmount({
  group,
  value,
  isGroupStart = false,
  fontMedium = false,
  warnIfPositive = false,
}: {
  group: UnitEconomicsColumnGroup;
  value: number;
  isGroupStart?: boolean;
  fontMedium?: boolean;
  warnIfPositive?: boolean;
}) {
  return (
    <td
      className={cn(
        'border-border bg-muted/30 border-t px-2 py-2 text-right text-[11px] font-semibold tabular-nums',
        unitEconomicsGroupDataCellClass(group, isGroupStart),
        unitEconomicsGroupAmountClass(group, value, { fontMedium, warnIfPositive }),
      )}
    >
      {formatAmount(value)}
    </td>
  );
}

export function UnitEconomicsOverviewFooter({ totals }: { totals: UnitEconomicsFilteredTotals }) {
  return (
    <tr>
      <FooterLabelCell />
      <FooterAmount group="in" value={totals.receivedAmount} isGroupStart />
      <FooterAmount group="in" value={totals.receivableAmount} />
      <FooterAmount group="out" value={totals.spentAmount} isGroupStart />
      <FooterAmount group="out" value={totals.remainingBonuses} />
      <FooterAmount group="out" value={totals.outCommittedAmount} />
      <FooterAmount group="balance" value={totals.cashBalance} isGroupStart fontMedium />
      <FooterAmount group="balance" value={totals.marginAfterCommitments} fontMedium />
    </tr>
  );
}

export function UnitEconomicsFundingFooter({ totals }: { totals: UnitEconomicsFilteredTotals }) {
  return (
    <tr>
      <FooterLabelCell />
      <FooterAmount group="in" value={totals.receivedAmount} isGroupStart />
      <FooterAmount group="balance" value={totals.cashBalance} isGroupStart fontMedium />
      <FooterAmount
        group="out"
        value={totals.overReleaseAmount}
        isGroupStart
        fontMedium
        warnIfPositive
      />
      <FooterAmount group="out" value={totals.outCommittedAmount} />
    </tr>
  );
}

export function UnitEconomicsOutflowsFooter({ totals }: { totals: UnitEconomicsFilteredTotals }) {
  return (
    <tr>
      <FooterLabelCell />
      <FooterAmount group="out" value={totals.spentAmount} isGroupStart />
      <FooterAmount group="out" value={totals.remainingBonuses} />
      <FooterAmount group="out" value={totals.outCommittedAmount} />
      <FooterAmount group="out" value={totals.paidBonuses} />
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
      <FooterLabelCell />
      <FooterAmount group="balance" value={totals.marginAfterCommitments} isGroupStart fontMedium />
      <FooterAmount group="balance" value={totals.marginFact} fontMedium />
      <FooterAmount group="in" value={totals.receivedAmount} isGroupStart />
      <FooterAmount group="out" value={totals.spentAmount} isGroupStart />
      <FooterAmount group="out" value={totals.remainingBonuses} />
      <FooterAmount group="out" value={totals.outCommittedAmount} />
    </tr>
  );
}
