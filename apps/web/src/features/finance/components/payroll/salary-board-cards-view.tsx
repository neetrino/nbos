'use client';

import { StatusBadge } from '@/components/shared';
import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import {
  employeeDisplayName,
  type SalaryBoardEntry,
} from '@/features/finance/components/payroll/salary-board-entries';
import { SalaryBoardCellButton } from '@/features/finance/components/payroll/salary-board-cell-button';
import type { SalaryBoardResponse } from '@/lib/api/payroll-runs';

export function SalaryBoardCardsView({
  data,
  rows,
  onOpenMonth,
}: {
  data: SalaryBoardResponse;
  rows: SalaryBoardResponse['rows'];
  onOpenMonth: (salaryLineId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">No employees match filters.</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const monthCells = row.cells
          .map((cell, idx) => {
            if (!cell) return null;
            return { cell, month: data.months[idx] ?? cell.payrollMonth };
          })
          .filter((item) => item !== null);
        return (
          <article
            key={row.employee.id}
            className="border-border bg-card flex flex-col rounded-xl border p-4"
          >
            <h3 className="text-foreground text-sm font-semibold">
              {employeeDisplayName(row.employee)}
            </h3>
            {row.employee.position ? (
              <p className="text-muted-foreground text-xs">{row.employee.position}</p>
            ) : null}
            <ul className="mt-3 flex flex-col gap-2">
              {monthCells.map(({ cell, month }) => {
                const phaseUi = COMPENSATION_PAYOUT_PHASE_UI[cell.payoutPhase];
                return (
                  <li key={cell.salaryLineId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-foreground text-xs font-medium tabular-nums">
                        {month}
                      </span>
                      <StatusBadge label={phaseUi.label} variant={phaseUi.variant} />
                    </div>
                    <SalaryBoardCellButton cell={cell} onOpen={onOpenMonth} />
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
