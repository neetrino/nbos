'use client';

import { FolderKanban, Hash, Percent } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { BONUS_BOARD_TYPE_CONFIG } from '@/features/finance/constants/bonus-board';
import {
  BONUS_ENTRY_STATUS_LABEL,
  BONUS_ENTRY_STATUS_VARIANT,
} from '@/features/finance/constants/bonus-board-status-ui';
import {
  employeeDisplayName,
  projectLabel,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusSalesAccrualHint } from '@/features/finance/utils/bonus-sales-accrual-hint';
import type { BonusEntryReleaseTotals } from '@/features/finance/utils/bonus-entry-release-totals';
import type { BonusEntryListRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function MetricCell({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass?: string;
}) {
  return (
    <div className="border-border bg-card rounded-xl border px-3 py-2.5">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className={cn('mt-1 text-base font-semibold tabular-nums', accentClass)}>{value}</p>
    </div>
  );
}

function ReleaseProgressBar({ totals }: { totals: BonusEntryReleaseTotals }) {
  const paidWidth = totals.planned > 0 ? Math.min(100, (totals.paid / totals.planned) * 100) : 0;
  const releasedWidth = Math.min(100, totals.releasePercent);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground font-medium">Release progress</span>
        <span className="font-semibold tabular-nums">{Math.round(totals.releasePercent)}%</span>
      </div>
      <div
        className="bg-muted relative h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={releasedWidth}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-teal-500/70 transition-[width]"
          style={{ width: `${releasedWidth}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${paidWidth}%` }}
        />
      </div>
      <p className="text-muted-foreground text-[10px]">
        Teal = released to payroll · Green = paid through expenses
      </p>
    </div>
  );
}

export function BonusEntryReleasesSheetSummary({
  entry,
  totals,
  releaseCount,
}: {
  entry: BonusEntryListRow;
  totals: BonusEntryReleaseTotals;
  releaseCount: number;
}) {
  const typeCfg = BONUS_BOARD_TYPE_CONFIG[entry.type];
  const project = projectLabel(entry.project);
  const salesHint = bonusSalesAccrualHint(entry);
  const percent = Number.parseFloat(entry.percent);
  const showPercent = Number.isFinite(percent) && percent > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${typeCfg.color}`}>
          {typeCfg.label}
        </span>
        <StatusBadge
          label={BONUS_ENTRY_STATUS_LABEL[entry.status]}
          variant={BONUS_ENTRY_STATUS_VARIANT[entry.status]}
        />
        {entry.payoutMonth ? (
          <span className="text-muted-foreground text-xs tabular-nums">
            Payroll · {entry.payoutMonth}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCell label="Planned" value={formatAmount(totals.planned)} />
        <MetricCell
          label="Released"
          value={formatAmount(totals.released)}
          accentClass="text-teal-700 dark:text-teal-400"
        />
        <MetricCell
          label="Paid"
          value={formatAmount(totals.paid)}
          accentClass="text-emerald-700 dark:text-emerald-400"
        />
        <MetricCell
          label="Remaining"
          value={formatAmount(totals.remaining)}
          accentClass={totals.remaining > 0 ? 'text-amber-700 dark:text-amber-400' : undefined}
        />
      </div>

      <ReleaseProgressBar totals={totals} />

      <div className="border-border bg-muted/30 space-y-2 rounded-xl border px-3 py-3 text-xs">
        <p className="text-foreground font-medium">{employeeDisplayName(entry.employee)}</p>
        {project ? (
          <p className="text-muted-foreground flex items-center gap-1.5">
            <FolderKanban size={12} className="shrink-0" aria-hidden />
            {project}
          </p>
        ) : null}
        <p className="text-muted-foreground flex items-center gap-1.5">
          <Hash size={12} className="shrink-0" aria-hidden />
          Order {entry.order.code}
        </p>
        {showPercent ? (
          <p className="text-muted-foreground flex items-center gap-1.5">
            <Percent size={12} className="shrink-0" aria-hidden />
            {percent}% of order basis
          </p>
        ) : null}
        {salesHint ? <p className="text-muted-foreground leading-snug">{salesHint}</p> : null}
        {entry.kpiGatePassed === false ? (
          <p className="text-amber-700 dark:text-amber-400">
            KPI gate not passed — release may be reduced at payroll attach.
          </p>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs">
        {releaseCount === 0
          ? 'No releases yet — amounts stay planned until Finance approves a release.'
          : `${releaseCount} release row${releaseCount === 1 ? '' : 's'} on this entry.`}
      </p>
    </div>
  );
}
