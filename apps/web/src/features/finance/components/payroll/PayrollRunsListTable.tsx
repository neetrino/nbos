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
import { payrollRunRemainingMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function PayrollRunsListTable(props: {
  items: PayrollRunListRow[];
  pageTotals: {
    payable: number;
    paid: number;
    remaining: number;
    lines: number;
    materialized: number;
  };
}) {
  const { items, pageTotals } = props;

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Lines</TableHead>
            <TableHead className="text-right">Expense cards</TableHead>
            <TableHead className="text-right">Total payable</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/finance/payroll/${row.id}`}
                  className="text-primary font-medium hover:underline"
                >
                  {row.payrollMonth}
                </Link>
              </TableCell>
              <TableCell>{PAYROLL_RUN_STATUS_LABEL[row.status]}</TableCell>
              <TableCell className="text-right">{row._count.salaryLines}</TableCell>
              <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                {row.materializedExpenseLineCount} / {row._count.salaryLines}
              </TableCell>
              <TableCell className="text-right">
                {formatAmount(parseAmount(row.totalPayable))}
              </TableCell>
              <TableCell className="text-right">
                {formatAmount(parseAmount(row.totalPaid))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(payrollRunRemainingMajorUnits(row.totalPayable, row.totalPaid))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell colSpan={2} className="text-muted-foreground text-xs">
              Visible page totals ({items.length} run{items.length === 1 ? '' : 's'})
            </TableCell>
            <TableCell className="text-right tabular-nums">{pageTotals.lines}</TableCell>
            <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
              {pageTotals.materialized}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(pageTotals.payable)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(pageTotals.paid)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(pageTotals.remaining)}
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}
