'use client';

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
      </Table>
    </div>
  );
}
