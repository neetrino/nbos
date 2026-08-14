'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Briefcase, CalendarDays, ChartPie, Check, Gift, TrendingUp, Wallet } from 'lucide-react';
import { DETAIL_SHEET_SECTION_SURFACE_CLASS, StatusBadge } from '@/components/shared';
import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import { payrollRunStatusUi } from '@/features/finance/constants/payroll-run-status-ui';
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function EmployeeMonthCompensationSummary({
  detail,
  readOnly,
}: {
  detail: SalaryLineMonthDetail;
  readOnly: boolean;
}) {
  const phaseUi = COMPENSATION_PAYOUT_PHASE_UI[detail.payoutPhase];
  const lineUi = salaryLineStatusBoardUi(detail.salaryLine.status);
  const base = parseAmount(detail.salaryLine.baseSalary);
  const bonuses = parseAmount(detail.salaryLine.bonusesTotal);
  const total = parseAmount(detail.salaryLine.totalPayable);
  const paid = parseAmount(detail.salaryLine.paidAmount);
  const remaining = parseAmount(detail.salaryLine.remainingAmount);
  const carry = detail.pendingPayrollCarryOver ? parseAmount(detail.pendingPayrollCarryOver) : null;

  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Wallet size={18} aria-hidden />
          </div>
          <h3 className="text-foreground text-base font-semibold tracking-tight">Month summary</h3>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <StatusBadge label={phaseUi.label} variant={phaseUi.variant} />
          <StatusBadge label={lineUi.label} variant={lineUi.variant} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
        <TotalPayableHero total={total} paid={paid} remaining={remaining} />
        <div className="flex min-w-0 flex-col justify-between gap-3">
          <BreakdownList base={base} bonuses={bonuses} carry={carry} />
          <PayrollRunFooter detail={detail} readOnly={readOnly} />
        </div>
      </div>
    </section>
  );
}

function TotalPayableHero({
  total,
  paid,
  remaining,
}: {
  total: number;
  paid: number;
  remaining: number;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-900/40 dark:bg-violet-950/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
            Total payable
          </p>
          <p className="text-foreground mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {formatAmount(total)}
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
          <TrendingUp size={20} aria-hidden />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-violet-200/70 pt-3 dark:border-violet-800/50">
        <HeroMetric
          icon={Check}
          iconShellClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
          label="Paid"
          value={formatAmount(paid)}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <HeroMetric
          icon={ChartPie}
          iconShellClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
          label="Remaining"
          value={formatAmount(remaining)}
          valueClassName="text-amber-600 dark:text-amber-400"
          bordered
        />
      </div>
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  iconShellClassName,
  label,
  value,
  valueClassName,
  bordered = false,
}: {
  icon: LucideIcon;
  iconShellClassName: string;
  label: string;
  value: string;
  valueClassName: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        bordered && 'border-l border-violet-200/70 pl-3 dark:border-violet-800/50',
      )}
    >
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full',
          iconShellClassName,
        )}
      >
        <Icon size={14} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={cn('text-xs font-medium', valueClassName)}>{label}</p>
        <p className={cn('truncate text-sm font-bold tabular-nums', valueClassName)}>{value}</p>
      </div>
    </div>
  );
}

function BreakdownList({
  base,
  bonuses,
  carry,
}: {
  base: number;
  bonuses: number;
  carry: number | null;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <BreakdownRow
        icon={Briefcase}
        iconShellClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"
        label="Base salary"
        value={formatAmount(base)}
      />
      <BreakdownRow
        icon={Gift}
        iconShellClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
        label="Bonuses"
        value={formatAmount(bonuses)}
        last={carry == null || carry <= 0}
      />
      {carry != null && carry > 0 ? (
        <BreakdownRow label="Pending carry-over" value={formatAmount(carry)} last />
      ) : null}
    </div>
  );
}

function BreakdownRow({
  icon: Icon,
  iconShellClassName,
  label,
  value,
  labelClassName,
  valueClassName,
  last = false,
}: {
  icon?: LucideIcon;
  iconShellClassName?: string;
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2.5',
        !last && 'border-border border-b border-dashed',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon && iconShellClassName ? (
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md',
              iconShellClassName,
            )}
          >
            <Icon size={13} aria-hidden />
          </span>
        ) : null}
        <span className={cn('text-muted-foreground text-sm', labelClassName)}>{label}</span>
      </div>
      <span className={cn('text-foreground text-sm font-semibold tabular-nums', valueClassName)}>
        {value}
      </span>
    </div>
  );
}

function PayrollRunFooter({
  detail,
  readOnly,
}: {
  detail: SalaryLineMonthDetail;
  readOnly: boolean;
}) {
  const runStatus = payrollRunStatusUi(detail.payrollRun.status);
  const monthValue: ReactNode = readOnly ? (
    <span className="text-foreground font-semibold tabular-nums">{detail.payrollMonth}</span>
  ) : (
    <Link
      href={`/finance/payroll/${detail.payrollRun.id}`}
      className="text-primary font-semibold tabular-nums hover:underline"
    >
      {detail.payrollMonth}
    </Link>
  );

  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-xl border px-3 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
        <CalendarDays size={16} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {readOnly ? 'Payroll month' : 'Payroll run'}
        </p>
        <div className="mt-0.5 text-sm">{monthValue}</div>
      </div>
      <StatusBadge
        label={runStatus.label}
        variant={runStatus.variant}
        dot
        className="self-center rounded-full"
      />
    </div>
  );
}
