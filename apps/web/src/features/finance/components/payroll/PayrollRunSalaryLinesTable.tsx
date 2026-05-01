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
import { formatAmount } from '@/features/finance/constants/finance';
import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { SalaryLineRow } from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function employeeName(emp: SalaryLineRow['employee']): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

export function PayrollRunSalaryLinesTable(props: { lines: SalaryLineRow[] }) {
  const { lines } = props;

  const lineTotals = useMemo(() => {
    return {
      base: sumMoneyStringsMajorUnits(lines.map((l) => l.baseSalary)),
      bonuses: sumMoneyStringsMajorUnits(lines.map((l) => l.bonusesTotal)),
      payable: sumMoneyStringsMajorUnits(lines.map((l) => l.totalPayable)),
      remaining: sumMoneyStringsMajorUnits(lines.map((l) => l.remainingAmount)),
    };
  }, [lines]);

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead className="text-right">Base</TableHead>
            <TableHead className="text-right">Bonuses</TableHead>
            <TableHead className="text-right">Payable</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead>Expense</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center text-sm">
                No salary lines. Create the run with “seed lines” or add lines in a future release.
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-medium">{employeeName(line.employee)}</TableCell>
                <TableCell className="text-right">
                  {formatAmount(parseAmount(line.baseSalary))}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(parseAmount(line.bonusesTotal))}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(parseAmount(line.totalPayable))}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(parseAmount(line.remainingAmount))}
                </TableCell>
                <TableCell>
                  {line.expense ? (
                    <Link
                      href={`/finance/expenses/${line.expense.id}`}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      {line.expense.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {lines.length > 0 ? (
          <tfoot>
            <TableRow className="bg-muted/30 font-medium">
              <TableCell className="text-muted-foreground text-xs">
                Line totals ({lines.length})
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
                {formatAmount(lineTotals.remaining)}
              </TableCell>
              <TableCell />
            </TableRow>
          </tfoot>
        ) : null}
      </Table>
    </div>
  );
}
