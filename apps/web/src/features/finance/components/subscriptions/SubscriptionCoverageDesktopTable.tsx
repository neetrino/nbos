'use client';

import type { Subscription, SubscriptionGridRow } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import {
  FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
  FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import {
  FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
  FinanceCalendarYearControl,
} from '../finance-calendar-year-control';
import { SubscriptionAmountHover } from './subscription-amount-hover';
import {
  SUBSCRIPTION_CALENDAR_SLOT_CLASS,
  SubscriptionCompactAmount,
  SubscriptionEmptyMonthCell,
  SubscriptionGridMonthCell,
  formatSubscriptionGridAmount,
} from './subscription-coverage-grid-cells';
import {
  MAX_SUBSCRIPTION_BOARD_YEAR_OFFSET,
  MIN_SUBSCRIPTION_BOARD_YEAR,
} from './subscription-coverage-grid-constants';
import {
  STICKY_LABEL_CELL_CLASS,
  STICKY_LABEL_HEADER_CLASS,
  STICKY_SURFACE_CLASS,
  STICKY_TOTAL_CELL_CLASS,
  STICKY_TOTAL_FOOTER_CLASS,
  STICKY_TOTAL_HEADER_CLASS,
  SUB_FOOTER_LABEL_CELL_CLASS,
  SUB_FOOTER_MONTH_CELL_CLASS,
  SUB_LABEL_COL_CLASS,
  SUB_MONTH_CELL_CLASS,
  SUB_MONTH_COL_CLASS,
  SUB_MONTH_HEAD_CLASS,
  TOTAL_STICKY_SURFACE_CLASS,
} from './subscription-coverage-desktop-classes';
import type { SubscriptionCalendarMonthLabel } from './subscription-coverage-grid-types';
import { SubscriptionGridRowLabel } from './SubscriptionGridRowLabel';

export interface SubscriptionCoverageDesktopTableProps {
  year: number;
  onYearChange: (year: number) => void;
  months: SubscriptionCalendarMonthLabel[];
  rows: SubscriptionGridRow[];
  subscriptionsById: Map<string, Subscription>;
  monthTotals: number[];
  grandAnnualTotal: number;
  preferFullTotal: boolean;
  totalColClass: string;
  onOpenSubscription: (subscriptionId: string) => void;
  onOpenMonthCell: (args: { subscriptionId: string; invoiceId: string | null }) => void;
}

export function SubscriptionCoverageDesktopTable({
  year,
  onYearChange,
  months,
  rows,
  subscriptionsById,
  monthTotals,
  grandAnnualTotal,
  preferFullTotal,
  totalColClass,
  onOpenSubscription,
  onOpenMonthCell,
}: SubscriptionCoverageDesktopTableProps) {
  return (
    <table className="w-full table-fixed border-collapse text-sm">
      <colgroup>
        <col className={SUB_LABEL_COL_CLASS} />
        {months.map((month) => (
          <col key={month.key} className={SUB_MONTH_COL_CLASS} />
        ))}
        <col className={totalColClass} />
      </colgroup>
      <SubscriptionCoverageDesktopHead
        year={year}
        onYearChange={onYearChange}
        months={months}
        totalColClass={totalColClass}
      />
      <tbody>
        {rows.map((row) => (
          <SubscriptionCoverageDesktopRow
            key={row.subscriptionId}
            row={row}
            subscription={subscriptionsById.get(row.subscriptionId)}
            preferFullTotal={preferFullTotal}
            totalColClass={totalColClass}
            onOpenSubscription={onOpenSubscription}
            onOpenMonthCell={onOpenMonthCell}
          />
        ))}
      </tbody>
      <tfoot>
        <SubscriptionCoverageDesktopFooter
          rowCount={rows.length}
          monthTotals={monthTotals}
          grandAnnualTotal={grandAnnualTotal}
          preferFullTotal={preferFullTotal}
          totalColClass={totalColClass}
        />
      </tfoot>
    </table>
  );
}

function SubscriptionCoverageDesktopHead({
  year,
  onYearChange,
  months,
  totalColClass,
}: {
  year: number;
  onYearChange: (year: number) => void;
  months: SubscriptionCalendarMonthLabel[];
  totalColClass: string;
}) {
  return (
    <thead>
      <tr className={STICKY_SURFACE_CLASS}>
        <th className={cn(STICKY_LABEL_HEADER_CLASS, 'py-2 normal-case')}>
          <div className={FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS}>
            <FinanceCalendarYearControl
              year={year}
              onYearChange={onYearChange}
              minYear={MIN_SUBSCRIPTION_BOARD_YEAR}
              maxYearOffset={MAX_SUBSCRIPTION_BOARD_YEAR_OFFSET}
            />
          </div>
        </th>
        {months.map((month) => (
          <th key={month.key} className={SUB_MONTH_HEAD_CLASS}>
            <span className="text-muted-foreground text-xs font-semibold">{month.label}</span>
          </th>
        ))}
        <th className={cn(STICKY_TOTAL_HEADER_CLASS, STICKY_SURFACE_CLASS, totalColClass)}>
          Total
        </th>
      </tr>
    </thead>
  );
}

function SubscriptionCoverageDesktopRow({
  row,
  subscription,
  preferFullTotal,
  totalColClass,
  onOpenSubscription,
  onOpenMonthCell,
}: {
  row: SubscriptionGridRow;
  subscription: Subscription | undefined;
  preferFullTotal: boolean;
  totalColClass: string;
  onOpenSubscription: (subscriptionId: string) => void;
  onOpenMonthCell: (args: { subscriptionId: string; invoiceId: string | null }) => void;
}) {
  return (
    <tr className="hover:bg-muted/15">
      <td
        className={STICKY_LABEL_CELL_CLASS}
        onClick={() => onOpenSubscription(row.subscriptionId)}
      >
        <SubscriptionGridRowLabel
          subscriptionName={row.subscriptionName}
          subscription={subscription}
          fallbackStatus={row.subscriptionStatus}
        />
      </td>
      {row.months.map((cell, idx) => (
        <td key={idx} className={SUB_MONTH_CELL_CLASS}>
          <SubscriptionGridMonthCell
            cell={cell}
            onOpen={() =>
              onOpenMonthCell({ subscriptionId: row.subscriptionId, invoiceId: cell.invoiceId })
            }
          />
        </td>
      ))}
      <td className={cn(STICKY_TOTAL_CELL_CLASS, TOTAL_STICKY_SURFACE_CLASS, totalColClass)}>
        <SubscriptionCompactAmount value={row.annualTotal} preferFullTotal={preferFullTotal} />
      </td>
    </tr>
  );
}

function SubscriptionCoverageDesktopFooter({
  rowCount,
  monthTotals,
  grandAnnualTotal,
  preferFullTotal,
  totalColClass,
}: {
  rowCount: number;
  monthTotals: number[];
  grandAnnualTotal: number;
  preferFullTotal: boolean;
  totalColClass: string;
}) {
  return (
    <tr className="font-medium">
      <td className={SUB_FOOTER_LABEL_CELL_CLASS}>
        Month total <span className="tabular-nums">{rowCount}</span>
      </td>
      {monthTotals.map((total, idx) => (
        <td key={idx} className={SUB_FOOTER_MONTH_CELL_CLASS}>
          <SubscriptionCoverageDesktopMonthTotal total={total} />
        </td>
      ))}
      <td
        className={cn(
          FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
          STICKY_TOTAL_FOOTER_CLASS,
          'z-50 border-t',
          totalColClass,
        )}
      >
        <SubscriptionCompactAmount
          value={grandAnnualTotal}
          preferFullTotal={preferFullTotal}
          size="base"
        />
      </td>
    </tr>
  );
}

function SubscriptionCoverageDesktopMonthTotal({ total }: { total: number }) {
  if (total <= 0) return <SubscriptionEmptyMonthCell />;
  return (
    <SubscriptionAmountHover
      amount={total}
      trigger={
        <div
          className={cn(FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS, SUBSCRIPTION_CALENDAR_SLOT_CLASS)}
        />
      }
    >
      {formatSubscriptionGridAmount(total, false)}
    </SubscriptionAmountHover>
  );
}
