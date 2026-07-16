'use client';

import { useMemo, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ChartPie,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Flame,
  Layers,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { BONUS_RELEASE_TYPE_UI } from '@/features/finance/constants/bonus-release-type-ui';
import {
  groupSalaryBonusBreakdownBySource,
  POLICY_PENDING_LABEL,
  type SalaryBonusBreakdownSourceGroup,
} from '@/features/finance/utils/group-salary-bonus-breakdown-by-source';
import type { BonusReleaseType } from '@/lib/api/bonus';
import type { SalaryLineMonthBonusRow, SalaryLineMonthDetail } from '@/lib/api/payroll-runs';
import { BonusBreakdownSummaryStrip } from '@/features/finance/components/payroll/bonus-breakdown-summary-strip';
import {
  BonusReleaseIdentityCard,
  BonusSourceIdentityCard,
} from '@/features/finance/components/payroll/bonus-identity-card';
import { BonusMetricTile } from '@/features/finance/components/payroll/bonus-metric-tile';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

type MetricDef = {
  icon: LucideIcon;
  iconShellClassName: string;
  label: string;
  value: string;
  tone?: 'default' | 'paid' | 'muted';
  title?: string;
};

const METRIC_GRID_CLASS = 'grid grid-cols-3 gap-2';

export function SalaryMonthBonusBreakdown({ detail }: { detail: SalaryLineMonthDetail }) {
  const sourceGroups = useMemo(
    () => groupSalaryBonusBreakdownBySource(detail.bonusBreakdown),
    [detail.bonusBreakdown],
  );

  if (detail.bonusBreakdown.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No bonus releases included in this payroll month.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BonusBreakdownSummaryStrip detail={detail} />
      <BonusSection
        icon={Layers}
        title="By bonus source"
        cards={sourceGroups.map((group) => (
          <SourceBonusCard key={group.key} group={group} />
        ))}
      />
      <BonusSection
        icon={CalendarDays}
        title="Releases this month"
        cards={detail.bonusBreakdown.map((row) => (
          <ReleaseBonusCard key={row.bonusReleaseId} row={row} />
        ))}
      />
    </div>
  );
}

function BonusSection({
  icon: Icon,
  title,
  cards,
}: {
  icon: LucideIcon;
  title: string;
  cards: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <Icon size={14} aria-hidden />
        {title}
      </h4>
      <div className="flex flex-col gap-3">{cards}</div>
    </section>
  );
}

function SourceBonusCard({ group }: { group: SalaryBonusBreakdownSourceGroup }) {
  const metrics: MetricDef[] = [
    {
      icon: CircleDollarSign,
      iconShellClassName:
        'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
      label: 'Full',
      value: formatAmount(group.planned),
    },
    {
      icon: FileText,
      iconShellClassName: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
      label: 'Payable',
      value: group.payable > 0 ? formatAmount(group.payable) : POLICY_PENDING_LABEL,
    },
    {
      icon: ChartPie,
      iconShellClassName:
        'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300',
      label: 'KPI %',
      value: POLICY_PENDING_LABEL,
    },
    {
      icon: Upload,
      iconShellClassName: 'bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300',
      label: 'Released',
      value: formatAmount(group.released),
    },
    {
      icon: Flame,
      iconShellClassName:
        'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300',
      label: 'Burned',
      value: group.burned > 0 ? formatAmount(group.burned) : POLICY_PENDING_LABEL,
    },
    {
      icon: RefreshCw,
      iconShellClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
      label: 'Carry-over',
      value: group.carryOver > 0 ? formatAmount(group.carryOver) : POLICY_PENDING_LABEL,
    },
    {
      icon: ShieldCheck,
      iconShellClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
      label: 'Included',
      value: formatAmount(group.included),
    },
    {
      icon: CheckCircle2,
      iconShellClassName:
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
      label: 'Paid',
      value: formatAmount(group.paid),
      tone: 'paid',
    },
    {
      icon: Clock3,
      iconShellClassName: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
      label: 'Remaining',
      value: formatAmount(group.remaining),
    },
  ];

  return (
    <article className="bg-muted/40 dark:bg-muted/20 rounded-2xl border border-transparent p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(8.5rem,11rem)_minmax(0,1fr)]">
        <BonusSourceIdentityCard
          projectHref={bonusBoardHref(group.projectId)}
          projectCode={group.projectCode}
          productLabel={group.productLabel}
          orderCode={group.orderCode}
        />
        <div className={METRIC_GRID_CLASS}>
          {metrics.map((metric) => (
            <BonusMetricTile key={metric.label} {...metric} />
          ))}
        </div>
      </div>
    </article>
  );
}

function ReleaseBonusCard({ row }: { row: SalaryLineMonthBonusRow }) {
  const releaseUi = BONUS_RELEASE_TYPE_UI[row.releaseType as BonusReleaseType];
  const isSales = row.type === 'SALES';
  const fullLabel = row.fullAmount != null ? formatAmount(parseAmount(row.fullAmount)) : '—';
  const payableLabel =
    row.payableAmount != null ? formatAmount(parseAmount(row.payableAmount)) : '—';
  const kpiPctLabel = row.kpiPayoutFactorPct != null ? `${row.kpiPayoutFactorPct}%` : '—';
  const burned = row.kpiBurnedAmount ? parseAmount(row.kpiBurnedAmount) : 0;
  const carry = row.payrollCarryOverAmount ? parseAmount(row.payrollCarryOverAmount) : 0;
  const included = row.includedAmount
    ? parseAmount(row.includedAmount)
    : parseAmount(row.releaseAmount);
  const paid = parseAmount(row.paidAmount);
  const remaining = parseAmount(row.remainingAmount);

  const metrics: MetricDef[] = [
    {
      icon: CircleDollarSign,
      iconShellClassName:
        'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
      label: 'Full',
      value: isSales ? fullLabel : formatAmount(parseAmount(row.plannedAmount)),
    },
    {
      icon: FileText,
      iconShellClassName: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
      label: 'Payable',
      value: isSales ? payableLabel : '—',
    },
    {
      icon: ChartPie,
      iconShellClassName:
        'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300',
      label: 'KPI %',
      value: isSales ? kpiPctLabel : '—',
      title: row.earnedPeriod ?? undefined,
    },
    {
      icon: Upload,
      iconShellClassName: 'bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300',
      label: 'Released',
      value: formatAmount(parseAmount(row.releaseAmount)),
    },
    {
      icon: ShieldCheck,
      iconShellClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
      label: 'Included',
      value: formatAmount(included),
    },
    {
      icon: Flame,
      iconShellClassName:
        'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300',
      label: 'Burned KPI',
      value: burned > 0 ? formatAmount(burned) : '—',
      title: row.kpiBurnedReason ?? undefined,
    },
    {
      icon: RefreshCw,
      iconShellClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
      label: 'Carry-over',
      value: carry > 0 ? formatAmount(carry) : '—',
    },
    {
      icon: CheckCircle2,
      iconShellClassName:
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
      label: 'Paid',
      value: formatAmount(paid),
      tone: 'paid',
    },
    {
      icon: Clock3,
      iconShellClassName: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
      label: 'Remaining',
      value: formatAmount(remaining),
    },
  ];

  return (
    <article className="bg-muted/40 dark:bg-muted/20 rounded-2xl border border-transparent p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(8.5rem,11rem)_minmax(0,1fr)]">
        <BonusReleaseIdentityCard
          productLabel={row.productLabel}
          orderCode={row.orderCode}
          releaseBadge={
            releaseUi ? (
              <StatusBadge label={releaseUi.label} variant={releaseUi.variant} />
            ) : (
              <span className="text-muted-foreground text-xs">{row.releaseType}</span>
            )
          }
        />
        <div className={METRIC_GRID_CLASS}>
          {metrics.map((metric) => (
            <BonusMetricTile key={metric.label} {...metric} />
          ))}
        </div>
      </div>
    </article>
  );
}
