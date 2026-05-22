'use client';

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
import {
  employeeDisplayName,
  type SalaryBoardEntry,
} from '@/features/finance/components/payroll/salary-board-entries';
import type { SalaryBoardFilteredTotals } from '@/features/finance/utils/salary-board-filtered-totals';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
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
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No salary lines match filters.
      </p>
    );
  }

  const footerTotals = totals ?? {
    lineCount: entries.length,
    payable: entries.reduce((s, e) => s + parseAmount(e.cell.totalPayable), 0),
    paid: entries.reduce((s, e) => s + parseAmount(e.cell.paidAmount), 0),
    remaining: entries.reduce((s, e) => s + parseAmount(e.cell.remainingAmount), 0),
  };

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Payable</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const lineUi = salaryLineStatusBoardUi(entry.cell.lineStatus);
            return (
              <TableRow key={entry.salaryLineId}>
                <TableCell>
                  <button
                    type="button"
                    className="text-foreground hover:text-primary text-left font-medium hover:underline"
                    onClick={() => onOpenMonth(entry.salaryLineId)}
                  >
                    {employeeDisplayName(entry.employee)}
                  </button>
                </TableCell>
                <TableCell className="tabular-nums">{entry.payrollMonth}</TableCell>
                <TableCell>
                  <StatusBadge label={lineUi.label} variant={lineUi.variant} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(parseAmount(entry.cell.totalPayable))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(parseAmount(entry.cell.paidAmount))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(parseAmount(entry.cell.remainingAmount))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell colSpan={4} className="text-muted-foreground text-xs">
              Filtered ({footerTotals.lineCount})
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(footerTotals.payable)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(footerTotals.paid)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(footerTotals.remaining)}
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}
