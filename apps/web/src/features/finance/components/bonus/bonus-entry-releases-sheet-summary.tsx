'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FolderKanban, Hash, Percent } from 'lucide-react';
import { employeeDisplayName } from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusSalesAccrualHint } from '@/features/finance/utils/bonus-sales-accrual-hint';
import {
  bonusEntryAutoPayable,
  bonusEntryPayableAdjustment,
  bonusEntryPayableCeiling,
} from '@/features/finance/utils/bonus-entry-payable';
import type { BonusEntryReleaseTotals } from '@/features/finance/utils/bonus-entry-release-totals';
import type { BonusEntryListRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

const ACCENT_ICON_SHELL =
  'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300';
const ACCENT_TEXT = 'text-violet-600 dark:text-violet-400';

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
      <p
        className={cn(
          'text-[10px] font-semibold tracking-wide uppercase',
          accentClass ?? 'text-muted-foreground',
        )}
      >
        {label}
      </p>
      <p className={cn('mt-1 text-base font-bold tabular-nums', accentClass ?? 'text-foreground')}>
        {value}
      </p>
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

function BonusEntryIdentityCard({ entry }: { entry: BonusEntryListRow }) {
  const percent = Number.parseFloat(entry.percent);
  const showPercent = Number.isFinite(percent) && percent > 0;
  const salesHint = bonusSalesAccrualHint(entry);
  const projectCode = entry.project?.code?.trim() || null;
  const projectName = entry.project?.name?.trim() || null;

  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <h3 className="text-foreground min-w-0 truncate text-lg font-bold tracking-tight">
          {employeeDisplayName(entry.employee)}
        </h3>
        {projectCode || projectName ? (
          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-md',
                ACCENT_ICON_SHELL,
              )}
            >
              <FolderKanban size={13} aria-hidden />
            </span>
            {projectCode ? (
              <span className="text-foreground text-sm font-medium tabular-nums">
                {projectCode}
              </span>
            ) : null}
            {projectCode && projectName ? (
              <span className="text-muted-foreground text-xs" aria-hidden>
                ·
              </span>
            ) : null}
            {projectName ? (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
                )}
              >
                {projectName}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          'border-border grid border-t',
          showPercent ? 'divide-border grid-cols-2 divide-x' : 'grid-cols-1',
        )}
      >
        <BonusIdentityDetailRow icon={Hash} label="Order" value={entry.order.code} />
        {showPercent ? (
          <BonusIdentityDetailRow
            icon={Percent}
            label="Percentage"
            value={
              <>
                <span className={cn('font-bold', ACCENT_TEXT)}>{percent}%</span>
                <span className="text-foreground"> of order basis</span>
              </>
            }
          />
        ) : null}
      </div>

      {salesHint ? (
        <p className="text-muted-foreground border-border border-t px-4 py-3 text-xs leading-snug">
          {salesHint}
        </p>
      ) : null}
    </section>
  );
}

function BonusIdentityDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          ACCENT_ICON_SHELL,
        )}
      >
        <Icon size={16} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-foreground mt-0.5 truncate text-sm font-bold tabular-nums">{value}</p>
      </div>
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
  const autoPayable = bonusEntryAutoPayable(entry);
  const adjustment = bonusEntryPayableAdjustment(entry);
  const payable = bonusEntryPayableCeiling(entry);
  const showPayableBreakdown =
    entry.type === 'SALES' || adjustment !== 0 || entry.payableAmount != null;

  return (
    <div className="space-y-4">
      {entry.payoutMonth ? (
        <p className="text-muted-foreground text-xs tabular-nums">Payroll · {entry.payoutMonth}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCell
          label="Payable"
          value={formatAmount(payable)}
          accentClass="text-violet-700 dark:text-violet-300"
        />
        <MetricCell
          label="Released"
          value={formatAmount(totals.released)}
          accentClass="text-teal-500 dark:text-teal-400"
        />
        <MetricCell
          label="Paid"
          value={formatAmount(totals.paid)}
          accentClass="text-green-600 dark:text-green-400"
        />
        <MetricCell
          label="Remaining"
          value={formatAmount(totals.remaining)}
          accentClass={
            totals.remaining > 0
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-slate-600 dark:text-slate-300'
          }
        />
      </div>

      {showPayableBreakdown ? (
        <div className="border-border bg-muted/20 grid grid-cols-2 gap-2 rounded-xl border p-3 text-xs sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-medium uppercase">Planned</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatAmount(parseFloat(entry.amount))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-medium uppercase">Auto (KPI)</p>
            <p className="mt-1 font-semibold tabular-nums">{formatAmount(autoPayable)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-medium uppercase">Adjustment</p>
            <p className="mt-1 font-semibold tabular-nums">{formatAmount(adjustment)}</p>
          </div>
        </div>
      ) : null}

      <ReleaseProgressBar totals={totals} />

      <BonusEntryIdentityCard entry={entry} />

      <p className="text-muted-foreground text-xs">
        {releaseCount === 0
          ? 'No releases yet — amounts stay planned until Finance approves a release.'
          : `${releaseCount} release row${releaseCount === 1 ? '' : 's'} on this entry.`}
      </p>
    </div>
  );
}
