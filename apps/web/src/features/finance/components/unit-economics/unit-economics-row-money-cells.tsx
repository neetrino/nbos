'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
import {
  parseUnitEconomicsMoney,
  parseUnitEconomicsSpent,
  unitEconomicsMarginClass,
  unitEconomicsSpentRaw,
  type UnitEconomicsSpentSource,
} from '@/features/finance/components/unit-economics/unit-economics-money';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

type MoneyRow = Pick<
  UnitEconomicsRow,
  | 'receivedAmount'
  | 'receivableAmount'
  | 'remainingBonuses'
  | 'outCommittedAmount'
  | 'cashBalance'
  | 'marginAfterCommitments'
> &
  UnitEconomicsSpentSource & {
    orderId?: string;
  };

function StaticAmount({ amount, className }: { amount: string; className?: string }) {
  return (
    <td className={cn('border-border border-b px-2 py-2 text-right tabular-nums', className)}>
      {formatAmount(parseUnitEconomicsMoney(amount))}
    </td>
  );
}

export function UnitEconomicsOverviewMoneyCells({
  row,
  onDrilldown,
  staticOnly = false,
}: {
  row: MoneyRow;
  onDrilldown?: DrilldownHandler;
  staticOnly?: boolean;
}) {
  const spentRaw = unitEconomicsSpentRaw(row);
  const margin = parseUnitEconomicsMoney(row.marginAfterCommitments);
  const cash = parseUnitEconomicsMoney(row.cashBalance);

  if (staticOnly || !onDrilldown || !row.orderId) {
    return (
      <>
        <StaticAmount amount={row.receivedAmount} />
        <StaticAmount amount={row.receivableAmount} />
        <StaticAmount amount={spentRaw} />
        <StaticAmount amount={row.remainingBonuses} />
        <StaticAmount amount={row.outCommittedAmount} />
        <StaticAmount amount={row.cashBalance} className={unitEconomicsMarginClass(cash)} />
        <StaticAmount
          amount={row.marginAfterCommitments}
          className={cn('font-medium', unitEconomicsMarginClass(margin))}
        />
      </>
    );
  }

  return (
    <>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={parseUnitEconomicsMoney(row.receivedAmount)}
          orderId={row.orderId}
          focus="payments"
          onDrilldown={onDrilldown}
        />
      </td>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={parseUnitEconomicsMoney(row.receivableAmount)}
          orderId={row.orderId}
          focus="invoices"
          onDrilldown={onDrilldown}
        />
      </td>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={parseUnitEconomicsSpent(row)}
          orderId={row.orderId}
          focus="expenses"
          onDrilldown={onDrilldown}
        />
      </td>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={parseUnitEconomicsMoney(row.remainingBonuses)}
          orderId={row.orderId}
          focus="bonuses"
          onDrilldown={onDrilldown}
        />
      </td>
      <StaticAmount amount={row.outCommittedAmount} />
      <StaticAmount amount={row.cashBalance} className={unitEconomicsMarginClass(cash)} />
      <StaticAmount
        amount={row.marginAfterCommitments}
        className={cn('font-medium', unitEconomicsMarginClass(margin))}
      />
    </>
  );
}
