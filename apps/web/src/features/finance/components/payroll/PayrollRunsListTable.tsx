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
import { payrollRunRemainingMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import {
  payrollRunStatusUi,
  payrollRunListRowClass,
} from '@/features/finance/constants/payroll-run-status-ui';
import { formatPayrollMonthLabel } from '@/features/finance/utils/salary-board-month-utils';
import { PayrollRunsPaidProgressBar } from '@/features/finance/components/payroll/payroll-runs-paid-progress';
import {
  FINANCE_LIST_SHELL_CLASS,
  FinanceListAmount,
} from '@/features/finance/components/shared/finance-list-table';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

const PAYROLL_LIST_ROW_CELL_CLASS = 'px-4 py-4 align-middle';
const PAYROLL_LIST_HEAD_CELL_CLASS = 'px-4 py-3';
const PAYROLL_LIST_FOOTER_CELL_CLASS = 'text-foreground px-4 py-3 text-sm font-bold tabular-nums';
const PAYROLL_LIST_FOOTER_LABEL_CLASS =
  'text-muted-foreground px-4 py-3 text-xs font-semibold uppercase tracking-wide';

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
    <div className={cn(FINANCE_LIST_SHELL_CLASS, 'overflow-x-auto')}>
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
            const statusUi = payrollRunStatusUi(row.status);

            return (
              <TableRow
                key={row.id}
                className={cn('cursor-pointer', payrollRunListRowClass(row.status))}
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
                  <span className="text-base font-semibold">{monthLabel}</span>
                </TableCell>
                <TableCell className={PAYROLL_LIST_ROW_CELL_CLASS}>
                  <span className="text-xs font-semibold tracking-wide uppercase">
                    {statusUi.label}
                  </span>
                </TableCell>
                <TableCell className={`${PAYROLL_LIST_ROW_CELL_CLASS} min-w-[8rem]`}>
                  <PayrollRunsPaidProgressBar paid={paid} payable={payable} className="h-2" />
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-right text-sm tabular-nums opacity-90`}
                >
                  {row._count.salaryLines}
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-right text-sm tabular-nums opacity-80`}
                >
                  {row.materializedExpenseLineCount} / {row._count.salaryLines}
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-right text-sm font-medium tabular-nums`}
                >
                  <FinanceListAmount amount={payable} className="justify-end" />
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-right text-sm tabular-nums`}
                >
                  <FinanceListAmount amount={paid} className="justify-end" />
                </TableCell>
                <TableCell
                  className={`${PAYROLL_LIST_ROW_CELL_CLASS} text-right text-sm font-semibold tabular-nums`}
                >
                  <FinanceListAmount
                    amount={payrollRunRemainingMajorUnits(row.totalPayable, row.totalPaid)}
                    className="justify-end"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/40 hover:bg-muted/40 border-border border-t-2">
            <TableCell colSpan={3} className={PAYROLL_LIST_FOOTER_LABEL_CLASS}>
              Total ({items.length} run{items.length === 1 ? '' : 's'})
            </TableCell>
            <TableCell className={`${PAYROLL_LIST_FOOTER_CELL_CLASS} text-right`}>
              {pageTotals.lines}
            </TableCell>
            <TableCell
              className={`${PAYROLL_LIST_FOOTER_CELL_CLASS} text-muted-foreground text-right text-xs font-semibold`}
            >
              {pageTotals.materialized}
            </TableCell>
            <TableCell className={`${PAYROLL_LIST_FOOTER_CELL_CLASS} text-right`}>
              <FinanceListAmount amount={pageTotals.payable} className="justify-end" />
            </TableCell>
            <TableCell className={`${PAYROLL_LIST_FOOTER_CELL_CLASS} text-right`}>
              <FinanceListAmount amount={pageTotals.paid} className="justify-end" />
            </TableCell>
            <TableCell className={`${PAYROLL_LIST_FOOTER_CELL_CLASS} text-right`}>
              <FinanceListAmount amount={pageTotals.remaining} className="justify-end" />
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}
