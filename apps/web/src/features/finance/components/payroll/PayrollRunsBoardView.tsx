'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import { PayrollRunBoardCard } from '@/features/finance/components/payroll/payroll-run-board-card';
import {
  PAYROLL_RUN_BOARD_LANE_LABEL,
  PAYROLL_RUN_BOARD_LANE_ORDER,
  groupPayrollRunsByBoardLane,
} from '@/features/finance/utils/payroll-run-board-lane';
import type { PayrollRunListRow, PayrollRunStatus } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

const PAYROLL_RUN_BOARD_LANE_HEADER_CLASS: Record<PayrollRunStatus, string> = {
  DRAFT: 'bg-muted/40',
  REVIEW: 'bg-amber-100/90 dark:bg-amber-900/35',
  APPROVED: 'bg-blue-100/90 dark:bg-blue-900/35',
  PAYING: 'bg-orange-100/90 dark:bg-orange-900/35',
  CLOSED: 'bg-green-100/90 dark:bg-green-900/35',
};

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function PayrollRunsBoardView({ items }: { items: PayrollRunListRow[] }) {
  const lanes = useMemo(() => groupPayrollRunsByBoardLane(items), [items]);

  return (
    <div className="grid min-h-[24rem] flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {PAYROLL_RUN_BOARD_LANE_ORDER.map((status) => {
        const laneItems = lanes[status];
        const lanePayable = laneItems.reduce((sum, row) => sum + parseAmount(row.totalPayable), 0);
        return (
          <section
            key={status}
            className="border-border bg-muted/15 flex min-h-0 flex-col rounded-xl border"
          >
            <header
              className={cn(
                'border-border border-b px-3 py-2.5',
                PAYROLL_RUN_BOARD_LANE_HEADER_CLASS[status],
              )}
            >
              <p className="text-sm font-semibold">{PAYROLL_RUN_BOARD_LANE_LABEL[status]}</p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {laneItems.length} · {formatAmount(lanePayable)} payable
              </p>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
              {laneItems.length === 0 ? (
                <p className="text-muted-foreground px-1 py-4 text-center text-xs">No runs</p>
              ) : (
                laneItems.map((run) => <PayrollRunBoardCard key={run.id} run={run} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
