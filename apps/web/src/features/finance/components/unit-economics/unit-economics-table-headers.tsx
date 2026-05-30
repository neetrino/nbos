'use client';

import { cn } from '@/lib/utils';

export type UnitEconomicsColumnGroup = 'in' | 'out' | 'balance';

type GroupMeta = {
  badge: string;
  bg: string;
  boundary: string;
};

const COLUMN_GROUP_META: Record<UnitEconomicsColumnGroup, GroupMeta> = {
  in: {
    badge: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-500/[0.06]',
    boundary: 'border-l-2 border-l-emerald-500/35',
  },
  out: {
    badge: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-500/[0.06]',
    boundary: 'border-l-2 border-l-amber-500/35',
  },
  balance: {
    badge: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-500/[0.06]',
    boundary: 'border-l-2 border-l-violet-500/35',
  },
};

const GROUP_BADGE_LABEL: Record<UnitEconomicsColumnGroup, string> = {
  in: 'In',
  out: 'Out',
  balance: 'Balance',
};

function UnitEconomicsTableLabelHeaderCell({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'border-border text-muted-foreground border-b px-3 py-2.5 text-left align-bottom',
        className,
      )}
    >
      <span className="text-[11px] font-semibold tracking-wide uppercase">{label}</span>
    </th>
  );
}

function UnitEconomicsTableMetricHeaderCell({
  label,
  group,
  isGroupStart = false,
  title,
}: {
  label: string;
  group?: UnitEconomicsColumnGroup;
  isGroupStart?: boolean;
  title?: string;
}) {
  const meta = group ? COLUMN_GROUP_META[group] : null;

  return (
    <th
      title={title}
      className={cn(
        'border-border border-b px-2 py-2 text-right align-bottom',
        meta?.bg,
        isGroupStart && meta?.boundary,
      )}
    >
      {group && isGroupStart ? (
        <span
          className={cn(
            'mb-0.5 block text-[9px] font-semibold tracking-wider uppercase',
            meta?.badge,
          )}
        >
          {GROUP_BADGE_LABEL[group]}
        </span>
      ) : (
        <span className="mb-0.5 block h-[13px]" aria-hidden />
      )}
      <span className="text-foreground block text-[11px] leading-tight font-semibold">{label}</span>
    </th>
  );
}

/** Shared In / Out / Balance column header for hierarchy and order overview tables. */
export function UnitEconomicsOverviewMoneyHeaderRow({
  labelColumn,
}: {
  labelColumn: 'Hierarchy' | 'Order';
}) {
  return (
    <tr>
      <UnitEconomicsTableLabelHeaderCell label={labelColumn} />
      <UnitEconomicsTableMetricHeaderCell label="Received" group="in" isGroupStart />
      <UnitEconomicsTableMetricHeaderCell label="To receive" group="in" />
      <UnitEconomicsTableMetricHeaderCell label="Spent" group="out" isGroupStart />
      <UnitEconomicsTableMetricHeaderCell label="Bonus to pay" group="out" />
      <UnitEconomicsTableMetricHeaderCell label="Committed" group="out" />
      <UnitEconomicsTableMetricHeaderCell label="Cash" group="balance" isGroupStart />
      <UnitEconomicsTableMetricHeaderCell label="Margin" group="balance" />
    </tr>
  );
}

/** Cash view — funding-focused columns with the same header language. */
export function UnitEconomicsFundingHeaderRow() {
  return (
    <tr>
      <UnitEconomicsTableLabelHeaderCell label="Order" />
      <UnitEconomicsTableMetricHeaderCell label="Received" group="in" isGroupStart />
      <UnitEconomicsTableMetricHeaderCell label="Cash balance" group="balance" isGroupStart />
      <UnitEconomicsTableMetricHeaderCell
        label="Over release"
        group="out"
        isGroupStart
        title="Released bonuses exceeding received cash."
      />
      <UnitEconomicsTableMetricHeaderCell label="Out committed" group="out" />
    </tr>
  );
}

/** Outflows view — money-out columns only. */
export function UnitEconomicsOutflowsHeaderRow() {
  return (
    <tr>
      <UnitEconomicsTableLabelHeaderCell label="Delivery unit" />
      <UnitEconomicsTableMetricHeaderCell label="Spent" group="out" isGroupStart />
      <UnitEconomicsTableMetricHeaderCell label="Bonus to pay" group="out" />
      <UnitEconomicsTableMetricHeaderCell label="Out committed" group="out" />
      <UnitEconomicsTableMetricHeaderCell label="Bonus paid" group="out" />
    </tr>
  );
}

/** Profitability view — balance first, then supporting in/out columns. */
export function UnitEconomicsProfitabilityHeaderRow() {
  return (
    <tr>
      <UnitEconomicsTableLabelHeaderCell label="Delivery unit" />
      <UnitEconomicsTableMetricHeaderCell
        label="Margin"
        group="balance"
        isGroupStart
        title="Margin after commitments"
      />
      <UnitEconomicsTableMetricHeaderCell label="Cash margin" group="balance" />
      <UnitEconomicsTableMetricHeaderCell label="Received" group="in" isGroupStart />
      <UnitEconomicsTableMetricHeaderCell label="Spent" group="out" isGroupStart />
      <UnitEconomicsTableMetricHeaderCell label="Bonus to pay" group="out" />
      <UnitEconomicsTableMetricHeaderCell label="Out committed" group="out" />
    </tr>
  );
}
