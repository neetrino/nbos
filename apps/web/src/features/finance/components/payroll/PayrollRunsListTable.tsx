'use client';

import { useRouter } from 'next/navigation';
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
import { formatPayrollMonthLabel } from '@/features/finance/utils/salary-board-month-utils';
import { PayrollRunStatusBadge } from '@/features/finance/components/payroll/payroll-run-status-badge';
import { PayrollRunsPaidProgressBar } from '@/features/finance/components/payroll/payroll-runs-paid-progress';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';

const PAYROLL_LIST_ROW_CELL_CLASS = 'px-4 py-4 align-middle';
const PAYROLL_LIST_HEAD_CELL_CLASS = 'px-4 py-3';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function payrollRunDetailHref(runId: string): string {
  return `/finance/payroll/${runId}`;
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
  const router = useRouter();

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={PAYROLL_LIST_HEAD_CELL_CLASS}>Month</TableHead>
            <TableHead className={PAYROLL_LIST_HEAD_CELL_CLASS}>Status</TableHead>
            <TableHead className={PAYROLL_LIST_HEAD_CELL_CLASS}>Progress</TableHead>
            <TableHead className={`${PAYROLL_LIST_HEAD_CELL_CLASS} text-right`}>Lines</TableHead>
            <TableHead className={`${PAYROLL_LIST_HEAD_CELL_CLASS} text-right`}>
              Expense cards
            </TableHead>
            <TableHead className={`${PAYROLL_LIST_HEAD_CELL_CLASS} text-right`}>
              Total payable
            </TableHead>
            <TableHead className={`${PAYROLL_LIST_HEAD_CELL_CLASS} text-right`}>Paid</TableHead>
            <TableHead className={`${PAYROLL_LIST_HEAD_CELL_CLASS} text-right`}>
              Remaining
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => {
            const payable = parseAmount(row.totalPayable);
            const paid = parseAmount(row.totalPaid);
            const monthLabel = formatPayrollMonthLabel(row.payrollMonth);
            const href = payrollRunDetailHref(row.id);

            return (
              <TableRow
                key={row.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => router.push(href)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(href);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Open payroll for ${monthLabel}`}
              >
                <TableCell className={PAYROLL_LIST_ROW_CELL_CLASS}>
                  <span className="text-foreground text-base font-semibold">{monthLabel}</span>
                </TableCell>
                <TableCell className={PAYROLL_LIST_ROW_CELL_CLASS}>
                  <PayrollRunStatusBadge status={row.status} />
                </TableCell>
                <TableCell className={`${PAYROLL_LIST_ROW_CELL_CLASS} min-w-[8rem]`}>
                  <PayrollRunsPaidProgressBar paid={paid} payable={payable} className="h-2" />
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-foreground text-right text-sm tabular-nums`}
                >
                  {row._count.salaryLines}
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-muted-foreground text-right text-sm tabular-nums`}
                >
                  {row.materializedExpenseLineCount} / {row._count.salaryLines}
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-foreground text-right text-sm font-medium tabular-nums`}
                >
                  {formatAmount(payable)}
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-right text-sm tabular-nums`}
                >
                  {formatAmount(paid)}
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-right text-sm font-medium tabular-nums`}
                >
                  {formatAmount(payrollRunRemainingMajorUnits(row.totalPayable, row.totalPaid))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/30 hover:bg-muted/30 font-medium">
            <TableCell colSpan={3} className="text-muted-foreground px-4 py-3 text-xs">
              Visible totals ({items.length} run{items.length === 1 ? '' : 's'})
            </TableCell>
            <TableCell className="px-4 py-3 text-right tabular-nums">{pageTotals.lines}</TableCell>
            <TableCell className="text-muted-foreground px-4 py-3 text-right text-xs tabular-nums">
              {pageTotals.materialized}
            </TableCell>
            <TableCell className="px-4 py-3 text-right tabular-nums">
              {formatAmount(pageTotals.payable)}
            </TableCell>
            <TableCell className="px-4 py-3 text-right tabular-nums">
              {formatAmount(pageTotals.paid)}
            </TableCell>
            <TableCell className="px-4 py-3 text-right tabular-nums">
              {formatAmount(pageTotals.remaining)}
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}
