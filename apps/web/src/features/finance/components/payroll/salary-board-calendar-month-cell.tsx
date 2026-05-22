'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import {
  salaryLineCalendarCellClass,
  salaryLineStatusBoardUi,
} from '@/features/finance/constants/salary-line-status-ui';
import { parseSalaryBoardAmount } from '@/features/finance/utils/salary-board-month-utils';
import type { SalaryBoardCell } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

export const SALARY_BOARD_CALENDAR_SLOT_CLASS = 'h-[3.25rem] w-full';

export function SalaryBoardCalendarEmptyCell() {
  return (
    <div
      className={cn(
        'border-border bg-muted/15 text-muted-foreground/70 flex items-center justify-center rounded-lg border border-dashed text-xs',
        SALARY_BOARD_CALENDAR_SLOT_CLASS,
      )}
      aria-hidden
    >
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
  const statusUi = salaryLineStatusBoardUi(cell.lineStatus);
  const payable = formatAmount(parseSalaryBoardAmount(cell.totalPayable));

  return (
    <button
      type="button"
      onClick={() => onOpen(cell.salaryLineId)}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border px-1 py-1.5 text-center transition-colors',
        SALARY_BOARD_CALENDAR_SLOT_CLASS,
        salaryLineCalendarCellClass(cell.lineStatus),
      )}
      aria-label={`${statusUi.label} · ${payable}`}
    >
      <span className="max-w-full truncate text-[9px] font-semibold tracking-wide uppercase opacity-90">
        {statusUi.label}
      </span>
      <span className="max-w-full truncate text-sm leading-none font-bold tabular-nums">
        {payable}
      </span>
    </button>
  );
}
