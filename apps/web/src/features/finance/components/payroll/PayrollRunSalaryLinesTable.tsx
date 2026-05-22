'use client';

import { useMemo } from 'react';
import Link from 'next/link';
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
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import { salaryBoardMonthSheetHref } from '@/features/finance/constants/expense-payroll-deep-link';
import { OPEN_EXPENSE_QUERY } from '@/features/finance/constants/expense-deep-link';
import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { SalaryLineRow } from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function employeeName(emp: SalaryLineRow['employee']): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

function expensePayHref(expenseId: string): string {
  const q = new URLSearchParams({ [OPEN_EXPENSE_QUERY]: expenseId });
  return `/finance/expenses?${q.toString()}`;
}

export function PayrollRunSalaryLinesTable({
  lines,
  onOpenMonth,
}: {
  lines: SalaryLineRow[];
  onOpenMonth?: (salaryLineId: string) => void;
}) {
  const lineTotals = useMemo(
    () => ({
      base: sumMoneyStringsMajorUnits(lines.map((l) => l.baseSalary)),
      bonuses: sumMoneyStringsMajorUnits(lines.map((l) => l.bonusesTotal)),
      payable: sumMoneyStringsMajorUnits(lines.map((l) => l.totalPayable)),
      paid: sumMoneyStringsMajorUnits(lines.map((l) => l.paidAmount)),
      remaining: sumMoneyStringsMajorUnits(lines.map((l) => l.remainingAmount)),
    }),
    [lines],
  );

  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">Salary lines</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Reconciliation per employee. After approval, each line gets an expense card; payments sync
        paid/remaining on the line.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Base</TableHead>
              <TableHead className="text-right">Bonuses</TableHead>
              <TableHead className="text-right">Payable</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Expense</TableHead>
              <TableHead>Month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground py-10 text-center text-sm">
                  No salary lines. Create the run with seed lines enabled.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => {
                const lineUi = salaryLineStatusBoardUi(line.status);
                return (
                  <TableRow key={line.id} id={`salary-line-${line.id}`}>
                    <TableCell className="font-medium">{employeeName(line.employee)}</TableCell>
                    <TableCell>
                      <StatusBadge label={lineUi.label} variant={lineUi.variant} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(parseAmount(line.baseSalary))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(parseAmount(line.bonusesTotal))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(parseAmount(line.totalPayable))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(parseAmount(line.paidAmount))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(parseAmount(line.remainingAmount))}
                    </TableCell>
                    <TableCell>
                      {line.expense ? (
                        <Link
                          href={expensePayHref(line.expense.id)}
                          className="text-primary text-sm font-medium hover:underline"
                          title="Open in Pay now (payments)"
                        >
                          {formatAmount(parseAmount(line.paidAmount))} /{' '}
                          {formatAmount(parseAmount(line.expense.amount))}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not materialized</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {onOpenMonth ? (
                        <button
                          type="button"
                          onClick={() => onOpenMonth(line.id)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          Details
                        </button>
                      ) : (
                        <Link
                          href={salaryBoardMonthSheetHref(line.id)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          Details
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {lines.length > 0 ? (
            <tfoot>
              <TableRow className="bg-muted/30 font-medium">
                <TableCell colSpan={2} className="text-muted-foreground text-xs">
                  Totals ({lines.length})
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(lineTotals.base)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(lineTotals.bonuses)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(lineTotals.payable)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(lineTotals.paid)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(lineTotals.remaining)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </tfoot>
          ) : null}
        </Table>
      </div>
    </section>
  );
}
