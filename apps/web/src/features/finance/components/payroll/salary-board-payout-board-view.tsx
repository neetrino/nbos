'use client';

import { useMemo } from 'react';
import { KanbanBoard, KanbanColumnMoneyTotal, type KanbanColumn } from '@/components/shared';
import {
  COMPENSATION_PAYOUT_PHASE_UI,
  SALARY_BOARD_KANBAN_PHASE_ORDER,
} from '@/features/finance/constants/compensation-payout-phase-ui';
import { SalaryBoardPayoutLineCard } from '@/features/finance/components/payroll/salary-board-payout-line-card';
import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';
import { parseSalaryBoardAmount } from '@/features/finance/utils/salary-board-month-utils';

const KANBAN_COLUMN_WIDTH = 270;

export function SalaryBoardPayoutBoardView({
  entries,
  onOpenMonth,
}: {
  entries: SalaryBoardEntry[];
  onOpenMonth: (salaryLineId: string) => void;
}) {
  const columns = useMemo((): KanbanColumn<SalaryBoardEntry>[] => {
    return SALARY_BOARD_KANBAN_PHASE_ORDER.map((phase) => {
      const items = entries
        .filter((e) => e.cell.payoutPhase === phase)
        .sort((a, b) => b.payrollMonth.localeCompare(a.payrollMonth));
      const ui = COMPENSATION_PAYOUT_PHASE_UI[phase];
      return {
        key: phase,
        label: ui.label,
        color: phase,
        hexColor: ui.hex,
        items,
        readonly: true,
      };
    });
  }, [entries]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KanbanBoard
        columns={columns}
        columnWidth={KANBAN_COLUMN_WIDTH}
        emptyMessage="No salary lines"
        getItemId={(entry) => entry.salaryLineId}
        renderCard={(entry) => <SalaryBoardPayoutLineCard entry={entry} onOpen={onOpenMonth} />}
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal
            column={column}
            getAmount={(entry) => parseSalaryBoardAmount(entry.cell.totalPayable)}
          />
        )}
      />
    </div>
  );
}
