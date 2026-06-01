'use client';

import { useMemo, type KeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  salaryLineListRowClass,
  salaryLineStatusBoardUi,
} from '@/features/finance/constants/salary-board-line-status';
import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { SalaryLineRow } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

const ROW_CELL = 'px-4 py-3.5 align-middle';
const HEAD_CELL = 'px-4 py-3 text-xs font-semibold uppercase tracking-wide';
const FOOTER_CELL = 'px-4 py-3 text-sm font-semibold tabular-nums';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function employeeName(emp: SalaryLineRow['employee']): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

function handleRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  salaryLineId: string,
  onOpen: (salaryLineId: string) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOpen(salaryLineId);
}

export function PayrollRunSalaryLinesView({
  lines,
  search,
  onOpenSalaryLine,
}: {
  lines: SalaryLineRow[];
  search: string;
  onOpenSalaryLine: (salaryLineId: string) => void;
}) {
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const sorted = [...lines].sort((a, b) =>
      employeeName(a.employee).localeCompare(employeeName(b.employee)),
    );
    if (!query) return sorted;
    return sorted.filter((line) => {
      const name = employeeName(line.employee).toLowerCase();
      const email = line.employee.email.toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [lines, query]);

  const totals = useMemo(
    () => ({
      base: sumMoneyStringsMajorUnits(filtered.map((l) => l.baseSalary)),
      bonuses: sumMoneyStringsMajorUnits(filtered.map((l) => l.bonusesTotal)),
      payable: sumMoneyStringsMajorUnits(filtered.map((l) => l.totalPayable)),
      paid: sumMoneyStringsMajorUnits(filtered.map((l) => l.paidAmount)),
      remaining: sumMoneyStringsMajorUnits(filtered.map((l) => l.remainingAmount)),
    }),
    [filtered],
  );

  if (lines.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No salary lines in this payroll run.
      </p>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No employees match this search.
      </p>
    );
  }

  return (
    <div className="border-border min-h-0 flex-1 overflow-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={HEAD_CELL}>Employee</TableHead>
            <TableHead className={HEAD_CELL}>Status</TableHead>
            <TableHead className={cn(HEAD_CELL, 'text-right')}>Base salary</TableHead>
            <TableHead className={cn(HEAD_CELL, 'text-right')}>Bonuses</TableHead>
            <TableHead className={cn(HEAD_CELL, 'text-right')}>Total payable</TableHead>
            <TableHead className={cn(HEAD_CELL, 'text-right')}>Paid</TableHead>
            <TableHead className={cn(HEAD_CELL, 'text-right')}>Remaining</TableHead>
            <TableHead className={cn(HEAD_CELL, 'w-10')} aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((line) => {
            const lineUi = salaryLineStatusBoardUi(line.status);
            return (
              <TableRow
                key={line.id}
                className={cn('group cursor-pointer', salaryLineListRowClass(line.status))}
                onClick={() => onOpenSalaryLine(line.id)}
                onKeyDown={(event) => handleRowKeyDown(event, line.id, onOpenSalaryLine)}
                tabIndex={0}
                role="button"
                aria-label={`${employeeName(line.employee)} · ${lineUi.label}`}
              >
                <TableCell className={ROW_CELL}>
                  <p className="text-foreground text-sm font-semibold">
                    {employeeName(line.employee)}
                  </p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {line.employee.email}
                  </p>
                </TableCell>
                <TableCell className={ROW_CELL}>
                  <StatusBadge label={lineUi.label} variant={lineUi.variant} />
                </TableCell>
                <TableCell className={cn(ROW_CELL, 'text-right tabular-nums')}>
                  {formatAmount(parseAmount(line.baseSalary))}
                </TableCell>
                <TableCell className={cn(ROW_CELL, 'text-right tabular-nums')}>
                  {formatAmount(parseAmount(line.bonusesTotal))}
                </TableCell>
                <TableCell
                  className={cn(ROW_CELL, 'text-foreground text-right font-semibold tabular-nums')}
                >
                  {formatAmount(parseAmount(line.totalPayable))}
                </TableCell>
                <TableCell className={cn(ROW_CELL, 'text-right tabular-nums')}>
                  {formatAmount(parseAmount(line.paidAmount))}
                </TableCell>
                <TableCell className={cn(ROW_CELL, 'text-right tabular-nums')}>
                  {formatAmount(parseAmount(line.remainingAmount))}
                </TableCell>
                <TableCell className={cn(ROW_CELL, 'w-10 px-2')}>
                  <ChevronRight
                    className="text-muted-foreground group-hover:text-foreground size-4 transition-colors"
                    aria-hidden
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell
              colSpan={2}
              className="text-muted-foreground px-4 py-3 text-xs font-semibold uppercase"
            >
              Totals ({filtered.length})
            </TableCell>
            <TableCell className={cn(FOOTER_CELL, 'text-right')}>
              {formatAmount(totals.base)}
            </TableCell>
            <TableCell className={cn(FOOTER_CELL, 'text-right')}>
              {formatAmount(totals.bonuses)}
            </TableCell>
            <TableCell className={cn(FOOTER_CELL, 'text-right')}>
              {formatAmount(totals.payable)}
            </TableCell>
            <TableCell className={cn(FOOTER_CELL, 'text-right')}>
              {formatAmount(totals.paid)}
            </TableCell>
            <TableCell className={cn(FOOTER_CELL, 'text-right')}>
              {formatAmount(totals.remaining)}
            </TableCell>
            <TableCell />
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}
