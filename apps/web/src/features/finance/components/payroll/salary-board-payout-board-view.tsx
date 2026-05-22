'use client';

import { useMemo } from 'react';
import { KanbanBoard, KanbanColumnMoneyTotal, type KanbanColumn } from '@/components/shared';
import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import {
  SALARY_BOARD_KANBAN_PHASE_ORDER,
  SALARY_BOARD_PAYOUT_PHASE_HEX,
} from '@/features/finance/constants/salary-board-payout-phase-hex';
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
        hexColor: SALARY_BOARD_PAYOUT_PHASE_HEX[phase],
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
