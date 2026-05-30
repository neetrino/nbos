'use client';

import {
  UNIT_ECONOMICS_COLUMN_GROUP_LABEL,
  unitEconomicsGroupBadgeClass,
  unitEconomicsGroupHeaderCellClass,
  type UnitEconomicsColumnGroup,
} from '@/features/finance/components/unit-economics/unit-economics-column-groups';
import { cn } from '@/lib/utils';

type MoneyHeaderColumn = {
  group: UnitEconomicsColumnGroup;
  label: string;
  isGroupStart?: boolean;
  title?: string;
};

const LABEL_HEADER_CELL =
  'border-border text-muted-foreground border-b px-3 py-2.5 text-left align-middle text-[11px] font-semibold tracking-wide uppercase';

const MONEY_HEADER_CELL =
  'border-border text-muted-foreground border-b px-2 py-2 text-right align-middle text-[11px] leading-tight font-semibold whitespace-nowrap';

function UnitEconomicsTableLabelHeaderCell({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return <th className={cn(LABEL_HEADER_CELL, className)}>{label}</th>;
}

function UnitEconomicsMoneyHeaderCell({
  group,
  label,
  isGroupStart = false,
  title,
}: MoneyHeaderColumn) {
  return (
    <th
      title={title}
      className={cn(MONEY_HEADER_CELL, unitEconomicsGroupHeaderCellClass(group, isGroupStart))}
    >
      <span className={unitEconomicsGroupBadgeClass(group)}>
        {UNIT_ECONOMICS_COLUMN_GROUP_LABEL[group]}
      </span>
      <span className="text-foreground mx-1 font-normal">·</span>
      <span className="text-foreground">{label}</span>
    </th>
  );
}

export function UnitEconomicsOverviewMoneyHeaderRow({
  labelColumn,
}: {
  labelColumn: 'Hierarchy' | 'Order';
}) {
  const columns: MoneyHeaderColumn[] = [
    { group: 'in', label: 'Received', isGroupStart: true },
    { group: 'in', label: 'To receive' },
    { group: 'out', label: 'Spent', isGroupStart: true },
    { group: 'out', label: 'Bonus to pay' },
    { group: 'out', label: 'Committed' },
    { group: 'balance', label: 'Cash', isGroupStart: true },
    { group: 'balance', label: 'Margin' },
  ];
  return (
    <tr>
      <UnitEconomicsTableLabelHeaderCell label={labelColumn} />
      {columns.map((column) => (
        <UnitEconomicsMoneyHeaderCell key={`${column.group}-${column.label}`} {...column} />
      ))}
    </tr>
  );
}

export function UnitEconomicsFundingHeaderRow() {
  const columns: MoneyHeaderColumn[] = [
    { group: 'in', label: 'Received', isGroupStart: true },
    { group: 'balance', label: 'Cash balance', isGroupStart: true },
    {
      group: 'out',
      label: 'Over release',
      isGroupStart: true,
      title: 'Released bonuses exceeding received cash.',
    },
    { group: 'out', label: 'Out committed' },
  ];
  return (
    <tr>
      <UnitEconomicsTableLabelHeaderCell label="Order" />
      {columns.map((column) => (
        <UnitEconomicsMoneyHeaderCell key={`${column.group}-${column.label}`} {...column} />
      ))}
    </tr>
  );
}

export function UnitEconomicsOutflowsHeaderRow() {
  const columns: MoneyHeaderColumn[] = [
    { group: 'out', label: 'Spent', isGroupStart: true },
    { group: 'out', label: 'Bonus to pay' },
    { group: 'out', label: 'Out committed' },
    { group: 'out', label: 'Bonus paid' },
  ];
  return (
    <tr>
      <UnitEconomicsTableLabelHeaderCell label="Delivery unit" />
      {columns.map((column) => (
        <UnitEconomicsMoneyHeaderCell key={`${column.group}-${column.label}`} {...column} />
      ))}
    </tr>
  );
}

export function UnitEconomicsProfitabilityHeaderRow() {
  const columns: MoneyHeaderColumn[] = [
    {
      group: 'balance',
      label: 'Margin',
      isGroupStart: true,
      title: 'Margin after commitments',
    },
    { group: 'balance', label: 'Cash margin' },
    { group: 'in', label: 'Received', isGroupStart: true },
    { group: 'out', label: 'Spent', isGroupStart: true },
    { group: 'out', label: 'Bonus to pay' },
    { group: 'out', label: 'Out committed' },
  ];
  return (
    <tr>
      <UnitEconomicsTableLabelHeaderCell label="Delivery unit" />
      {columns.map((column) => (
        <UnitEconomicsMoneyHeaderCell key={`${column.group}-${column.label}`} {...column} />
      ))}
    </tr>
  );
}
