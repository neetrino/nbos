'use client';

import { Fragment, useMemo, type KeyboardEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  salaryLineListRowClass,
  salaryLineStatusBoardUi,
} from '@/features/finance/constants/salary-board-line-status';
import {
  employeeDisplayName,
  type SalaryBoardEntry,
} from '@/features/finance/components/payroll/salary-board-entries';
import type { SalaryBoardFilteredTotals } from '@/features/finance/utils/salary-board-filtered-totals';
import {
  formatPayrollMonthLabel,
  parseSalaryBoardAmount,
} from '@/features/finance/utils/salary-board-month-utils';
import { cn } from '@/lib/utils';

const SALARY_LIST_ROW_CELL_CLASS = 'px-4 py-4 align-middle';
const SALARY_LIST_HEAD_CELL_CLASS = 'px-4 py-3';
const SALARY_LIST_FOOTER_CELL_CLASS = 'text-foreground px-4 py-3 text-sm font-bold tabular-nums';
const SALARY_LIST_FOOTER_LABEL_CLASS =
  'text-muted-foreground px-4 py-3 text-xs font-semibold uppercase tracking-wide';
const SALARY_LIST_COLUMN_COUNT = 5;

interface SalaryBoardMonthGroup {
  payrollMonth: string;
  entries: SalaryBoardEntry[];
}

function groupEntriesByPayrollMonth(entries: SalaryBoardEntry[]): SalaryBoardMonthGroup[] {
  const byMonth = new Map<string, SalaryBoardEntry[]>();
  for (const entry of entries) {
    const monthEntries = byMonth.get(entry.payrollMonth) ?? [];
    monthEntries.push(entry);
    byMonth.set(entry.payrollMonth, monthEntries);
  }
  return [...byMonth.entries()]
    .sort(([monthA], [monthB]) => monthB.localeCompare(monthA))
    .map(([payrollMonth, monthEntries]) => ({
      payrollMonth,
      entries: [...monthEntries].sort((a, b) =>
        employeeDisplayName(a.employee).localeCompare(employeeDisplayName(b.employee)),
      ),
    }));
}

function handleSalaryListRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  salaryLineId: string,
  onOpenMonth: (salaryLineId: string) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOpenMonth(salaryLineId);
}

export function SalaryBoardListView({
  entries,
  totals,
  onOpenMonth,
}: {
  entries: SalaryBoardEntry[];
  totals?: SalaryBoardFilteredTotals;
  onOpenMonth: (salaryLineId: string) => void;
}) {
  const monthGroups = useMemo(() => groupEntriesByPayrollMonth(entries), [entries]);

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No salary lines match filters.
      </p>
    );
  }

  const footerTotals = totals ?? {
    lineCount: entries.length,
    payable: entries.reduce((s, e) => s + parseSalaryBoardAmount(e.cell.totalPayable), 0),
    paid: entries.reduce((s, e) => s + parseSalaryBoardAmount(e.cell.paidAmount), 0),
    remaining: entries.reduce((s, e) => s + parseSalaryBoardAmount(e.cell.remainingAmount), 0),
  };

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={SALARY_LIST_HEAD_CELL_CLASS}>Employee</TableHead>
            <TableHead className={SALARY_LIST_HEAD_CELL_CLASS}>Status</TableHead>
            <TableHead className={`${SALARY_LIST_HEAD_CELL_CLASS} text-right`}>Payable</TableHead>
            <TableHead className={`${SALARY_LIST_HEAD_CELL_CLASS} text-right`}>Paid</TableHead>
            <TableHead className={`${SALARY_LIST_HEAD_CELL_CLASS} text-right`}>Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthGroups.map(({ payrollMonth, entries: monthEntries }) => (
            <Fragment key={payrollMonth}>
              <SalaryBoardListMonthDivider payrollMonth={payrollMonth} />
              {monthEntries.map((entry) => (
                <SalaryBoardListEntryRow
                  key={entry.salaryLineId}
                  entry={entry}
                  onOpenMonth={onOpenMonth}
                />
              ))}
            </Fragment>
          ))}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell colSpan={2} className={SALARY_LIST_FOOTER_LABEL_CLASS}>
              Filtered ({footerTotals.lineCount})
            </TableCell>
            <TableCell className={`${SALARY_LIST_FOOTER_CELL_CLASS} text-right`}>
              {formatAmount(footerTotals.payable)}
            </TableCell>
            <TableCell className={`${SALARY_LIST_FOOTER_CELL_CLASS} text-right`}>
              {formatAmount(footerTotals.paid)}
            </TableCell>
            <TableCell className={`${SALARY_LIST_FOOTER_CELL_CLASS} text-right`}>
              {formatAmount(footerTotals.remaining)}
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}

function SalaryBoardListMonthDivider({ payrollMonth }: { payrollMonth: string }) {
  return (
    <TableRow className="bg-muted/25 hover:bg-muted/25 border-0">
      <TableCell colSpan={SALARY_LIST_COLUMN_COUNT} className="px-4 py-0">
        <div
          className="flex items-center gap-3 py-3"
          role="separator"
          aria-label={formatPayrollMonthLabel(payrollMonth)}
        >
          <span className="text-foreground shrink-0 text-sm font-semibold tabular-nums">
            {formatPayrollMonthLabel(payrollMonth)}
          </span>
          <div className="border-border h-px min-w-0 flex-1 border-t" aria-hidden />
        </div>
      </TableCell>
    </TableRow>
  );
}

function SalaryBoardListEntryRow({
  entry,
  onOpenMonth,
}: {
  entry: SalaryBoardEntry;
  onOpenMonth: (salaryLineId: string) => void;
}) {
  const lineUi = salaryLineStatusBoardUi(entry.cell.lineStatus);
  const payable = parseSalaryBoardAmount(entry.cell.totalPayable);
  const paid = parseSalaryBoardAmount(entry.cell.paidAmount);
  const remaining = parseSalaryBoardAmount(entry.cell.remainingAmount);

  return (
    <TableRow
      className={cn('cursor-pointer', salaryLineListRowClass(entry.cell.lineStatus))}
      onClick={() => onOpenMonth(entry.salaryLineId)}
      onKeyDown={(event) => handleSalaryListRowKeyDown(event, entry.salaryLineId, onOpenMonth)}
      tabIndex={0}
      role="button"
      aria-label={`${employeeDisplayName(entry.employee)} · ${lineUi.label}`}
    >
      <TableCell className={SALARY_LIST_ROW_CELL_CLASS}>
        <span className="text-base font-semibold">{employeeDisplayName(entry.employee)}</span>
        {entry.employee.position ? (
          <p className="mt-0.5 truncate text-xs opacity-80">{entry.employee.position}</p>
        ) : null}
      </TableCell>
      <TableCell className={SALARY_LIST_ROW_CELL_CLASS}>
        <span className="text-xs font-semibold tracking-wide uppercase">{lineUi.label}</span>
      </TableCell>
      <TableCell
        className={`${SALARY_LIST_ROW_CELL_CLASS} text-right text-sm font-medium tabular-nums`}
      >
        {formatAmount(payable)}
      </TableCell>
      <TableCell
        className={`${SALARY_LIST_ROW_CELL_CLASS} text-right text-sm tabular-nums opacity-90`}
      >
        {formatAmount(paid)}
      </TableCell>
      <TableCell
        className={`${SALARY_LIST_ROW_CELL_CLASS} text-right text-sm font-medium tabular-nums`}
      >
        {formatAmount(remaining)}
      </TableCell>
    </TableRow>
  );
}
