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
import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import {
  employeeDisplayName,
  type SalaryBoardEntry,
} from '@/features/finance/components/payroll/salary-board-entries';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function SalaryBoardListView({
  entries,
  onOpenMonth,
}: {
  entries: SalaryBoardEntry[];
  onOpenMonth: (salaryLineId: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No salary lines match filters.
      </p>
    );
  }

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Payout</TableHead>
            <TableHead>Line</TableHead>
            <TableHead className="text-right">Payable</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const lineUi = salaryLineStatusBoardUi(entry.cell.lineStatus);
            const phaseUi = COMPENSATION_PAYOUT_PHASE_UI[entry.cell.payoutPhase];
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
                  <StatusBadge label={phaseUi.label} variant={phaseUi.variant} />
                </TableCell>
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
      </Table>
    </div>
  );
}
