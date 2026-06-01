'use client';

import { Target } from 'lucide-react';
import type { SalaryBoardCell } from '@/lib/api/payroll-runs';
import { formatPayrollMonthShort } from '@/features/finance/utils/salary-board-month-utils';

function formatKpiPct(raw: string | null): string | null {
  if (raw == null) return null;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  return `${Math.round(n)}%`;
}

export function SalaryBoardSalesKpiStrip({
  summary,
}: {
  summary: SalaryBoardCell['salesKpiSummary'];
}) {
  if (summary == null) {
    return null;
  }

  const attainment = formatKpiPct(summary.attainmentPct);
  const payout = summary.payoutFactorPct != null ? `${summary.payoutFactorPct}% payout` : null;
  const earnedLabel = formatPayrollMonthShort(summary.earnedPeriod);

  if (summary.source === 'NOT_SYNCED') {
    return (
      <p className="text-muted-foreground mt-2 flex items-center gap-1 text-[10px] leading-snug">
        <Target size={10} className="shrink-0" aria-hidden />
        KPI {earnedLabel}: not finalized
      </p>
    );
  }

  const parts = [`KPI ${earnedLabel}`];
  if (attainment != null) {
    parts.push(attainment);
  }
  if (payout != null) {
    parts.push(payout);
  }

  return (
    <p className="text-muted-foreground mt-2 flex items-center gap-1 text-[10px] leading-snug tabular-nums">
      <Target size={10} className="shrink-0" aria-hidden />
      {parts.join(' · ')}
    </p>
  );
}
