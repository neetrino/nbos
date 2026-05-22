'use client';

import { StatusBadge } from '@/components/shared';
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import { formatAmount } from '@/features/finance/constants/finance';
import { parseSalaryBoardAmount } from '@/features/finance/utils/salary-board-month-utils';
import type { SalaryBoardCell } from '@/lib/api/payroll-runs';

export function SalaryBoardCellButton({
  cell,
  onOpen,
}: {
  cell: SalaryBoardCell;
  onOpen: (salaryLineId: string) => void;
}) {
  const lineUi = salaryLineStatusBoardUi(cell.lineStatus);

  return (
    <button
      type="button"
      onClick={() => onOpen(cell.salaryLineId)}
      className="hover:bg-muted/60 flex w-full flex-col items-center gap-0.5 rounded-md px-1 py-1.5 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-center gap-1">
        <StatusBadge label={lineUi.label} variant={lineUi.variant} />
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">
        {formatAmount(parseSalaryBoardAmount(cell.totalPayable))}
      </span>
    </button>
  );
}
