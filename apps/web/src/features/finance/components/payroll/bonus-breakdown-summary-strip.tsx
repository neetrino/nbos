'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';
import { BonusPolicyBreakdownBadges } from './bonus-policy-breakdown-badges';
import type { BonusPolicyBreakdownStatus } from '@/features/finance/constants/bonus-breakdown-status-ui';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function activeSummaryTags(
  summary: SalaryLineMonthDetail['bonusBreakdownSummary'],
): BonusPolicyBreakdownStatus[] {
  const tags: BonusPolicyBreakdownStatus[] = [];
  if (summary.incomingCount > 0) tags.push('INCOMING');
  if (parseAmount(summary.burnedTotal) > 0) tags.push('BURNED');
  if (parseAmount(summary.carryOverTotal) > 0) tags.push('CARRY_OVER');
  if (summary.clawbackCount > 0) tags.push('CLAWBACK');
  return tags;
}

export function BonusBreakdownSummaryStrip({ detail }: { detail: SalaryLineMonthDetail }) {
  const summary = detail.bonusBreakdownSummary;
  const tags = activeSummaryTags(summary);
  if (tags.length === 0 && detail.bonusBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="border-border bg-muted/30 mb-4 flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-xs">
      <span className="text-muted-foreground font-medium">Policy breakdown</span>
      <BonusPolicyBreakdownBadges statuses={tags} />
      {parseAmount(summary.burnedTotal) > 0 ? (
        <span className="text-muted-foreground tabular-nums">
          Burned {formatAmount(parseAmount(summary.burnedTotal))}
        </span>
      ) : null}
      {parseAmount(summary.carryOverTotal) > 0 ? (
        <span className="text-muted-foreground tabular-nums">
          Carry-over {formatAmount(parseAmount(summary.carryOverTotal))}
        </span>
      ) : null}
      {detail.salaryLine.payrollCarryAppliedAmount ? (
        <span className="text-muted-foreground tabular-nums">
          Applied this month{' '}
          {formatAmount(parseAmount(detail.salaryLine.payrollCarryAppliedAmount))}
        </span>
      ) : null}
      {detail.pendingPayrollCarryOver ? (
        <span className="text-muted-foreground tabular-nums">
          Pending prior months {formatAmount(parseAmount(detail.pendingPayrollCarryOver))}
        </span>
      ) : null}
    </div>
  );
}
