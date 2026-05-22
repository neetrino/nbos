'use client';

import { Calendar, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import { employeeDisplayName } from '@/features/finance/components/payroll/salary-board-entries';
import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  formatPayrollMonthShort,
  parseSalaryBoardAmount,
} from '@/features/finance/utils/salary-board-month-utils';

export function SalaryBoardPayoutLineCard({
  entry,
  onOpen,
}: {
  entry: SalaryBoardEntry;
  onOpen: (salaryLineId: string) => void;
}) {
  const lineUi = salaryLineStatusBoardUi(entry.cell.lineStatus);
  const phaseUi = COMPENSATION_PAYOUT_PHASE_UI[entry.cell.payoutPhase];
  const payable = parseSalaryBoardAmount(entry.cell.totalPayable);
  const remaining = parseSalaryBoardAmount(entry.cell.remainingAmount);

  return (
    <button
      type="button"
      onClick={() => onOpen(entry.salaryLineId)}
      className="border-border bg-card hover:bg-muted/40 w-full rounded-xl border p-3 text-left shadow-sm transition-colors"
    >
      <div className="flex items-start gap-2">
        <User size={14} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">
            {employeeDisplayName(entry.employee)}
          </p>
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
      <div className="mt-2 flex flex-wrap gap-1">
        <StatusBadge label={phaseUi.label} variant={phaseUi.variant} />
        <StatusBadge label={lineUi.label} variant={lineUi.variant} />
      </div>
    </button>
  );
}
