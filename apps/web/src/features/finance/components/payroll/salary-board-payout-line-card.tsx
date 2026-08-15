'use client';

import type { LucideIcon } from 'lucide-react';
import { AppWindow, Calendar, Clock3 } from 'lucide-react';
import { KanbanCardShell } from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import {
  employeeDisplayName,
  type SalaryBoardEntry,
} from '@/features/finance/components/payroll/salary-board-entries';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  formatPayrollMonthAbbrev,
  parseSalaryBoardAmount,
} from '@/features/finance/utils/salary-board-month-utils';
import { SalaryBoardSalesKpiStrip } from '@/features/finance/components/payroll/salary-board-sales-kpi-strip';
import { cn } from '@/lib/utils';

export function SalaryBoardPayoutLineCard({
  entry,
  onOpen,
}: {
  entry: SalaryBoardEntry;
  onOpen: (salaryLineId: string) => void;
}) {
  return (
    <KanbanCardShell
      as="article"
      radius="xl"
      padding="none"
      baseShadow="sm"
      hoverShadow="md"
      className="group relative overflow-hidden"
    >
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'block cursor-pointer space-y-3 p-3.5',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        )}
        onClick={() => onOpen(entry.salaryLineId)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(entry.salaryLineId);
          }
        }}
      >
        <SalaryCardHeader entry={entry} />
        <SalaryCardMetrics entry={entry} />
        <SalaryBoardSalesKpiStrip summary={entry.cell.salesKpiSummary} />
      </div>
    </KanbanCardShell>
  );
}

function SalaryCardHeader({ entry }: { entry: SalaryBoardEntry }) {
  const lineUi = salaryLineStatusBoardUi(entry.cell.lineStatus);
  const name = employeeDisplayName(entry.employee);
  const hideStatusInPaidColumn = entry.cell.payoutPhase === 'past_paid';
  const eyebrowParts = [
    hideStatusInPaidColumn ? null : lineUi.label,
    entry.employee.position,
  ].filter((part): part is string => Boolean(part && part.trim()));

  return (
    <header className="flex items-center gap-2.5">
      <EmployeePersonAvatar
        label={name}
        imageUrl={entry.employee.avatar}
        className="size-10 rounded-xl text-xs"
      />
      <div className="min-w-0 flex-1">
        {eyebrowParts.length > 0 ? (
          <p className="text-muted-foreground truncate text-[10px] font-semibold tracking-[0.14em] uppercase">
            {eyebrowParts.join(' · ')}
          </p>
        ) : null}
        <p className="text-foreground truncate text-base leading-tight font-bold tracking-tight">
          {name}
        </p>
      </div>
    </header>
  );
}

function SalaryCardMetrics({ entry }: { entry: SalaryBoardEntry }) {
  const payable = parseSalaryBoardAmount(entry.cell.totalPayable);
  const paidAmount = parseSalaryBoardAmount(entry.cell.paidAmount);
  const remainingAmount = parseSalaryBoardAmount(entry.cell.remainingAmount);

  return (
    <div className="border-border/60 space-y-3 border-t pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-foreground min-w-0 truncate text-lg font-bold tracking-tight tabular-nums">
          {formatAmount(payable)}
        </p>
        <p className="text-primary flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums">
          <Calendar size={14} aria-hidden />
          {formatPayrollMonthAbbrev(entry.payrollMonth)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SalaryMetric
          icon={AppWindow}
          iconShellClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
          label="Paid"
          value={formatAmount(paidAmount)}
        />
        <SalaryMetric
          icon={Clock3}
          iconShellClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
          label="Left"
          value={formatAmount(remainingAmount)}
          bordered
        />
      </div>
    </div>
  );
}

function SalaryMetric({
  icon: Icon,
  iconShellClassName,
  label,
  value,
  bordered = false,
}: {
  icon: LucideIcon;
  iconShellClassName: string;
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div className={cn('min-w-0', bordered && 'border-border/60 border-l pl-2')}>
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md',
            iconShellClassName,
          )}
        >
          <Icon size={12} aria-hidden />
        </div>
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
          {label}
        </p>
      </div>
      <p className="text-foreground mt-1 truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
