'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
import {
  unitEconomicsGroupAmountClass,
  unitEconomicsGroupDataCellClass,
  type UnitEconomicsColumnGroup,
} from '@/features/finance/components/unit-economics/unit-economics-column-groups';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

const DATA_CELL_BASE = 'border-border border-b px-2 py-2 text-right tabular-nums';

export function UnitEconomicsMoneyCell({
  group,
  isGroupStart = false,
  value,
  fontMedium = false,
  warnIfPositive = false,
}: {
  group: UnitEconomicsColumnGroup;
  isGroupStart?: boolean;
  value: number;
  fontMedium?: boolean;
  warnIfPositive?: boolean;
}) {
  return (
    <td
      className={cn(
        DATA_CELL_BASE,
        unitEconomicsGroupDataCellClass(group, isGroupStart),
        unitEconomicsGroupAmountClass(group, value, { fontMedium, warnIfPositive }),
      )}
    >
      {formatAmount(value)}
    </td>
  );
}

export function UnitEconomicsDrilldownMoneyCell({
  group,
  isGroupStart = false,
  amount,
  orderId,
  focus,
  onDrilldown,
  fontMedium = false,
}: {
  group: UnitEconomicsColumnGroup;
  isGroupStart?: boolean;
  amount: number;
  orderId: string;
  focus: UnitEconomicsDrilldownFocus;
  onDrilldown?: (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;
  fontMedium?: boolean;
}) {
  return (
    <td className={cn(DATA_CELL_BASE, unitEconomicsGroupDataCellClass(group, isGroupStart))}>
      <UnitEconomicsDrilldownAmount
        amount={amount}
        orderId={orderId}
        focus={focus}
        onDrilldown={onDrilldown}
        className={unitEconomicsGroupAmountClass(group, amount, { fontMedium })}
      />
    </td>
  );
}
