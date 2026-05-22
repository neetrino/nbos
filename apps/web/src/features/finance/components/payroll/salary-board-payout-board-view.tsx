'use client';

import { StatusBadge } from '@/components/shared';
import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import {
  employeeDisplayName,
  SALARY_BOARD_PAYOUT_PHASE_ORDER,
  type SalaryBoardEntry,
} from '@/features/finance/components/payroll/salary-board-entries';
import { SalaryBoardCellButton } from '@/features/finance/components/payroll/salary-board-cell-button';
import type { CompensationPayoutPhase } from '@/lib/api/payroll-runs';
import { useMemo } from 'react';

export function SalaryBoardPayoutBoardView({
  entries,
  onOpenMonth,
}: {
  entries: SalaryBoardEntry[];
  onOpenMonth: (salaryLineId: string) => void;
}) {
  const byPhase = useMemo(() => {
    const map = new Map<CompensationPayoutPhase, SalaryBoardEntry[]>();
    for (const phase of SALARY_BOARD_PAYOUT_PHASE_ORDER) {
      map.set(phase, []);
    }
    for (const entry of entries) {
      map.get(entry.cell.payoutPhase)?.push(entry);
    }
    for (const phase of SALARY_BOARD_PAYOUT_PHASE_ORDER) {
      const list = map.get(phase) ?? [];
      list.sort((a, b) => b.payrollMonth.localeCompare(a.payrollMonth));
    }
    return map;
  }, [entries]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {SALARY_BOARD_PAYOUT_PHASE_ORDER.map((phase) => {
        const phaseEntries = byPhase.get(phase) ?? [];
        const ui = COMPENSATION_PAYOUT_PHASE_UI[phase];
        return (
          <div
            key={phase}
            className="border-border bg-card flex min-h-[12rem] flex-col rounded-xl border p-3"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-foreground text-xs font-semibold">{ui.label}</h3>
              <StatusBadge label={String(phaseEntries.length)} variant="gray" />
            </div>
            <p className="text-muted-foreground mt-1 text-[11px] leading-snug">{ui.description}</p>
            <ul className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto">
              {phaseEntries.length === 0 ? (
                <li className="text-muted-foreground text-xs">No lines</li>
              ) : (
                phaseEntries.map((entry) => (
                  <li
                    key={entry.salaryLineId}
                    className="border-border rounded-lg border px-2 py-2"
                  >
                    <p className="text-foreground text-xs font-medium">
                      {employeeDisplayName(entry.employee)}
                    </p>
                    <p className="text-muted-foreground text-[10px] tabular-nums">
                      {entry.payrollMonth}
                    </p>
                    <div className="mt-1">
                      <SalaryBoardCellButton cell={entry.cell} onOpen={onOpenMonth} compact />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
