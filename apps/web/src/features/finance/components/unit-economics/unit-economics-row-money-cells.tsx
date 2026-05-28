'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

function marginClass(margin: number): string {
  if (margin < 0) return 'text-destructive';
  if (margin > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

function StaticAmount({ amount, className }: { amount: string; className?: string }) {
  return (
    <td className={cn('border-border border-b px-2 py-2 text-right tabular-nums', className)}>
      {formatAmount(amount)}
    </td>
  );
}

export function UnitEconomicsOverviewMoneyCells({
  row,
  onDrilldown,
  staticOnly = false,
}: {
  row: Pick<
    UnitEconomicsRow,
    | 'orderId'
    | 'receivedAmount'
    | 'receivableAmount'
    | 'outFactAmount'
    | 'remainingBonuses'
    | 'outCommittedAmount'
    | 'cashBalance'
    | 'marginAfterCommitments'
  >;
  onDrilldown?: DrilldownHandler;
  staticOnly?: boolean;
}) {
  const margin = Number.parseFloat(row.marginAfterCommitments);
  if (staticOnly || !onDrilldown) {
    return (
      <>
        <StaticAmount amount={row.receivedAmount} />
        <StaticAmount amount={row.receivableAmount} />
        <StaticAmount amount={row.outFactAmount} />
        <StaticAmount amount={row.remainingBonuses} />
        <StaticAmount amount={row.outCommittedAmount} />
        <StaticAmount
          amount={row.cashBalance}
          className={marginClass(Number.parseFloat(row.cashBalance))}
        />
        <StaticAmount
          amount={row.marginAfterCommitments}
          className={cn('font-medium', marginClass(margin))}
        />
      </>
    );
  }

  return (
    <>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={Number.parseFloat(row.receivedAmount)}
          orderId={row.orderId}
          focus="payments"
          onDrilldown={onDrilldown}
        />
      </td>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={Number.parseFloat(row.receivableAmount)}
          orderId={row.orderId}
          focus="invoices"
          onDrilldown={onDrilldown}
        />
      </td>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={Number.parseFloat(row.outFactAmount)}
          orderId={row.orderId}
          focus="expenses"
          onDrilldown={onDrilldown}
        />
      </td>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={Number.parseFloat(row.remainingBonuses)}
          orderId={row.orderId}
          focus="bonuses"
          onDrilldown={onDrilldown}
        />
      </td>
      <StaticAmount amount={row.outCommittedAmount} />
      <StaticAmount
        amount={row.cashBalance}
        className={marginClass(Number.parseFloat(row.cashBalance))}
      />
      <StaticAmount
        amount={row.marginAfterCommitments}
        className={cn('font-medium', marginClass(margin))}
      />
    </>
  );
}
