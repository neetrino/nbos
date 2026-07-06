'use client';

import { Calendar, User } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import { employeeDisplayName } from '@/features/finance/components/payroll/salary-board-entries';
import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  formatPayrollMonthShort,
  parseSalaryBoardAmount,
} from '@/features/finance/utils/salary-board-month-utils';
import { SalaryBoardSalesKpiStrip } from '@/features/finance/components/payroll/salary-board-sales-kpi-strip';

export function SalaryBoardPayoutLineCard({
  entry,
  onOpen,
}: {
  entry: SalaryBoardEntry;
  onOpen: (salaryLineId: string) => void;
}) {
  const lineUi = salaryLineStatusBoardUi(entry.cell.lineStatus);
  const payable = parseSalaryBoardAmount(entry.cell.totalPayable);
  const remaining = parseSalaryBoardAmount(entry.cell.remainingAmount);

  return (
    <KanbanCardShell
      as="button"
      type="button"
      hoverShadow={false}
      hoverSurface="muted40"
      baseShadow="sm"
      transition="colors"
      className="w-full text-left"
      onClick={() => onOpen(entry.salaryLineId)}
    >
      <div className="flex items-start gap-2">
        <User size={14} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground min-w-0 truncate text-sm font-semibold">
              {employeeDisplayName(entry.employee)}
            </p>
            <StatusBadge
              label={lineUi.label}
              variant={lineUi.variant}
              className="shrink-0 text-[10px]"
            />
          </div>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
            <Calendar size={10} aria-hidden />
            {formatPayrollMonthShort(entry.payrollMonth)}
          </p>
        </div>
      </div>
      <p className="text-foreground mt-2.5 text-base font-semibold tabular-nums">
        {formatAmount(payable)}
      </p>
      <p className="text-muted-foreground text-[10px] tabular-nums">
        {formatAmount(parseSalaryBoardAmount(entry.cell.paidAmount))} paid ·{' '}
        {formatAmount(remaining)} left
      </p>
      <SalaryBoardSalesKpiStrip summary={entry.cell.salesKpiSummary} />
    </KanbanCardShell>
  );
}
