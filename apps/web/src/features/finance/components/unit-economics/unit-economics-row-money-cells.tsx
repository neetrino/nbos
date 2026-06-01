'use client';

import {
  parseUnitEconomicsMoney,
  parseUnitEconomicsSpent,
  type UnitEconomicsSpentSource,
} from '@/features/finance/components/unit-economics/unit-economics-money';
import {
  UnitEconomicsDrilldownMoneyCell,
  UnitEconomicsMoneyCell,
} from '@/features/finance/components/unit-economics/unit-economics-money-cell';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';

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

export function UnitEconomicsOverviewMoneyCells({
  row,
  onDrilldown,
  staticOnly = false,
}: {
  row: MoneyRow;
  onDrilldown?: DrilldownHandler;
  staticOnly?: boolean;
}) {
  const spent = parseUnitEconomicsSpent(row);

  if (staticOnly || !onDrilldown || !row.orderId) {
    return (
      <>
        <UnitEconomicsMoneyCell
          group="in"
          isGroupStart
          value={parseUnitEconomicsMoney(row.receivedAmount)}
        />
        <UnitEconomicsMoneyCell group="in" value={parseUnitEconomicsMoney(row.receivableAmount)} />
        <UnitEconomicsMoneyCell group="out" isGroupStart value={spent} />
        <UnitEconomicsMoneyCell group="out" value={parseUnitEconomicsMoney(row.remainingBonuses)} />
        <UnitEconomicsMoneyCell
          group="out"
          value={parseUnitEconomicsMoney(row.outCommittedAmount)}
        />
        <UnitEconomicsMoneyCell
          group="balance"
          isGroupStart
          value={parseUnitEconomicsMoney(row.cashBalance)}
          fontMedium
        />
        <UnitEconomicsMoneyCell
          group="balance"
          value={parseUnitEconomicsMoney(row.marginAfterCommitments)}
          fontMedium
        />
      </>
    );
  }

  return (
    <>
      <UnitEconomicsDrilldownMoneyCell
        group="in"
        isGroupStart
        amount={parseUnitEconomicsMoney(row.receivedAmount)}
        orderId={row.orderId}
        focus="payments"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsDrilldownMoneyCell
        group="in"
        amount={parseUnitEconomicsMoney(row.receivableAmount)}
        orderId={row.orderId}
        focus="invoices"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsDrilldownMoneyCell
        group="out"
        isGroupStart
        amount={spent}
        orderId={row.orderId}
        focus="expenses"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsDrilldownMoneyCell
        group="out"
        amount={parseUnitEconomicsMoney(row.remainingBonuses)}
        orderId={row.orderId}
        focus="bonuses"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsMoneyCell group="out" value={parseUnitEconomicsMoney(row.outCommittedAmount)} />
      <UnitEconomicsMoneyCell
        group="balance"
        isGroupStart
        value={parseUnitEconomicsMoney(row.cashBalance)}
        fontMedium
      />
      <UnitEconomicsMoneyCell
        group="balance"
        value={parseUnitEconomicsMoney(row.marginAfterCommitments)}
        fontMedium
      />
    </>
  );
}

export function UnitEconomicsFundingMoneyCells({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: DrilldownHandler;
}) {
  return (
    <>
      <UnitEconomicsDrilldownMoneyCell
        group="in"
        isGroupStart
        amount={parseUnitEconomicsMoney(row.receivedAmount)}
        orderId={row.orderId}
        focus="payments"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsMoneyCell
        group="balance"
        isGroupStart
        value={parseUnitEconomicsMoney(row.cashBalance)}
        fontMedium
      />
      <UnitEconomicsMoneyCell
        group="out"
        isGroupStart
        value={parseUnitEconomicsMoney(row.overReleaseAmount)}
        fontMedium
        warnIfPositive
      />
      <UnitEconomicsMoneyCell group="out" value={parseUnitEconomicsMoney(row.outCommittedAmount)} />
    </>
  );
}

export function UnitEconomicsOutflowsMoneyCells({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: DrilldownHandler;
}) {
  return (
    <>
      <UnitEconomicsDrilldownMoneyCell
        group="out"
        isGroupStart
        amount={parseUnitEconomicsSpent(row)}
        orderId={row.orderId}
        focus="expenses"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsDrilldownMoneyCell
        group="out"
        amount={parseUnitEconomicsMoney(row.remainingBonuses)}
        orderId={row.orderId}
        focus="bonuses"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsMoneyCell group="out" value={parseUnitEconomicsMoney(row.outCommittedAmount)} />
      <UnitEconomicsMoneyCell group="out" value={parseUnitEconomicsMoney(row.paidBonuses)} />
    </>
  );
}

export function UnitEconomicsProfitabilityMoneyCells({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: DrilldownHandler;
}) {
  return (
    <>
      <UnitEconomicsMoneyCell
        group="balance"
        isGroupStart
        value={parseUnitEconomicsMoney(row.marginAfterCommitments)}
        fontMedium
      />
      <UnitEconomicsMoneyCell
        group="balance"
        value={parseUnitEconomicsMoney(row.marginFact)}
        fontMedium
      />
      <UnitEconomicsDrilldownMoneyCell
        group="in"
        isGroupStart
        amount={parseUnitEconomicsMoney(row.receivedAmount)}
        orderId={row.orderId}
        focus="payments"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsDrilldownMoneyCell
        group="out"
        isGroupStart
        amount={parseUnitEconomicsSpent(row)}
        orderId={row.orderId}
        focus="expenses"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsDrilldownMoneyCell
        group="out"
        amount={parseUnitEconomicsMoney(row.remainingBonuses)}
        orderId={row.orderId}
        focus="bonuses"
        onDrilldown={onDrilldown}
      />
      <UnitEconomicsMoneyCell group="out" value={parseUnitEconomicsMoney(row.outCommittedAmount)} />
    </>
  );
}
