'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import { SALARY_LINE_STATUS_MESSAGE_KEY } from '@/features/finance/components/payroll/payroll-i18n-keys';
import { PAYROLL_RUN_STATUS_MESSAGE_KEY } from '@/features/finance/constants/payroll-run-ui';
import { FINANCE_CALENDAR_CELL_EMPTY } from '@/features/finance/constants/finance-calendar-cell-colors';
import { formatAmount, formatAmountAbbreviated } from '@/features/finance/constants/finance';
import { salaryLineCalendarCellClass } from '@/features/finance/constants/salary-board-line-status';
import {
  formatPayrollMonthAbbrev,
  parseSalaryBoardAmount,
} from '@/features/finance/utils/salary-board-month-utils';
import type { SalaryBoardCell, SalaryBoardColumn } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

export const SALARY_CALENDAR_SLOT_CLASS = 'h-16 w-full';

/** `preferFullTotal` → full amount; else compact `2M` / `200K`. */
export function formatSalaryCalendarTotalAmount(amount: number, preferFullTotal: boolean): string {
  return preferFullTotal ? formatAmount(amount) : formatAmountAbbreviated(amount);
}

export function SalaryBoardCalendarTotalAmount({
  amount,
  preferFullTotal,
  size = 'sm',
}: {
  amount: number;
  preferFullTotal: boolean;
  size?: 'sm' | 'base';
}) {
  const display = formatSalaryCalendarTotalAmount(amount, preferFullTotal);
  const fullAmount = formatAmount(amount);
  const isCompact = !preferFullTotal;

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center text-center',
        size === 'sm' && SALARY_CALENDAR_SLOT_CLASS,
      )}
      title={isCompact ? fullAmount : undefined}
    >
      <span
        className={cn(
          'inline-flex max-w-full items-baseline justify-center gap-0.5',
          isCompact && 'truncate',
        )}
      >
        <span
          className={cn(
            'truncate leading-tight font-bold tabular-nums',
            size === 'base' ? 'text-base' : 'text-sm',
          )}
        >
          {display}
        </span>
        {isCompact ? (
          <AmdCurrencyIcon
            className={cn('shrink-0 font-bold opacity-90', size === 'base' ? 'text-sm' : 'text-xs')}
          />
        ) : null}
      </span>
    </div>
  );
}

export function SalaryBoardCalendarEmptyCell() {
  return (
    <div className={cn(FINANCE_CALENDAR_CELL_EMPTY, SALARY_CALENDAR_SLOT_CLASS)} aria-hidden>
      —
    </div>
  );
}

export function SalaryBoardCalendarMonthCell({
  cell,
  onOpen,
}: {
  cell: SalaryBoardCell;
  onOpen: (salaryLineId: string) => void;
}) {
  const t = useTranslations('payroll');
  const statusLabel = t(SALARY_LINE_STATUS_MESSAGE_KEY[cell.lineStatus]);
  const payableValue = parseSalaryBoardAmount(cell.totalPayable);
  const payable = formatAmountAbbreviated(payableValue);

  return (
    <button
      type="button"
      onClick={() => onOpen(cell.salaryLineId)}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border px-1 py-1.5 text-center transition-colors',
        SALARY_CALENDAR_SLOT_CLASS,
        salaryLineCalendarCellClass(cell.lineStatus),
      )}
      aria-label={t('salary.cellAria', {
        status: statusLabel,
        amount: formatAmount(payableValue),
      })}
    >
      <span className="max-w-full truncate text-[9px] font-semibold tracking-wide uppercase opacity-90">
        {statusLabel}
      </span>
      <span className="max-w-full truncate text-sm leading-tight font-bold tabular-nums">
        {payable}
      </span>
    </button>
  );
}

export function SalaryBoardCalendarMonthHeader({ column }: { column: SalaryBoardColumn }) {
  const t = useTranslations('payroll');
  const label = formatPayrollMonthAbbrev(column.payrollMonth);
  const runLabel = column.runStatus ? t(PAYROLL_RUN_STATUS_MESSAGE_KEY[column.runStatus]) : null;

  return (
    <div className="flex flex-col items-center gap-1">
      {column.payrollRunId ? (
        <Link
          href={`/finance/payroll/${column.payrollRunId}`}
          className="text-foreground hover:text-primary text-xs font-semibold hover:underline"
        >
          {label}
        </Link>
      ) : (
        <span className="text-muted-foreground text-xs font-semibold">{label}</span>
      )}
      {runLabel ? (
        <span className="text-muted-foreground max-w-full truncate text-[8px] leading-tight">
          {runLabel}
        </span>
      ) : (
        <span className="text-muted-foreground text-[8px]">{t('salary.noRun')}</span>
      )}
    </div>
  );
}
