'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { BONUS_RELEASE_TYPE_UI } from '@/features/finance/constants/bonus-release-type-ui';
import {
  groupSalaryBonusBreakdownBySource,
  POLICY_PENDING_LABEL,
} from '@/features/finance/utils/group-salary-bonus-breakdown-by-source';
import type { BonusReleaseType } from '@/lib/api/bonus';
import type { SalaryLineMonthBonusRow, SalaryLineMonthDetail } from '@/lib/api/payroll-runs';
import { useMemo } from 'react';
import { BonusBreakdownSummaryStrip } from '@/features/finance/components/payroll/bonus-breakdown-summary-strip';
import { BonusPolicyBreakdownBadges } from '@/features/finance/components/payroll/bonus-policy-breakdown-badges';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function BonusBySourceTable({ rows }: { rows: readonly SalaryLineMonthBonusRow[] }) {
  const groups = useMemo(() => groupSalaryBonusBreakdownBySource(rows), [rows]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Policy</TableHead>
          <TableHead className="text-right">Full</TableHead>
          <TableHead className="text-right">Payable</TableHead>
          <TableHead className="text-right">KPI %</TableHead>
          <TableHead className="text-right">Released</TableHead>
          <TableHead className="text-right">Burned</TableHead>
          <TableHead className="text-right">Carry-over</TableHead>
          <TableHead className="text-right">Included</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <TableRow key={group.key}>
            <TableCell
              className="max-w-[7rem] truncate font-mono text-xs"
              title={group.projectCode}
            >
              <Link href={bonusBoardHref(group.projectId)} className="text-primary hover:underline">
                {group.projectCode}
              </Link>
            </TableCell>
            <TableCell className="max-w-[10rem] truncate text-sm" title={group.productLabel}>
              {group.productLabel}
              <span className="text-muted-foreground block font-mono text-[10px]">
                {group.orderCode}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatAmount(group.planned)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {group.payable > 0 ? formatAmount(group.payable) : POLICY_PENDING_LABEL}
            </TableCell>
            <TableCell className="text-muted-foreground text-right tabular-nums">—</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(group.released)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {group.burned > 0 ? formatAmount(group.burned) : POLICY_PENDING_LABEL}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {group.carryOver > 0 ? formatAmount(group.carryOver) : POLICY_PENDING_LABEL}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(group.included)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatAmount(group.paid)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(group.remaining)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BonusReleaseLinesTable({ rows }: { rows: readonly SalaryLineMonthBonusRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Release</TableHead>
          <TableHead className="text-right">Full</TableHead>
          <TableHead className="text-right">Payable</TableHead>
          <TableHead className="text-right">KPI %</TableHead>
          <TableHead className="text-right">Released</TableHead>
          <TableHead className="text-right">Included</TableHead>
          <TableHead className="text-right">Burned KPI</TableHead>
          <TableHead className="text-right">Carry-over</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const releaseUi = BONUS_RELEASE_TYPE_UI[row.releaseType as BonusReleaseType];
          const isSales = row.type === 'SALES';
          const fullLabel =
            row.fullAmount != null ? formatAmount(parseAmount(row.fullAmount)) : '—';
          const payableLabel =
            row.payableAmount != null ? formatAmount(parseAmount(row.payableAmount)) : '—';
          const kpiPctLabel = row.kpiPayoutFactorPct != null ? `${row.kpiPayoutFactorPct}%` : '—';
          return (
            <TableRow key={row.bonusReleaseId}>
              <TableCell className="max-w-[10rem] truncate text-sm" title={row.productLabel}>
                {row.productLabel}
              </TableCell>
              <TableCell>
                <BonusPolicyBreakdownBadges statuses={row.policyBreakdownStatuses} />
              </TableCell>
              <TableCell>
                {releaseUi ? (
                  <StatusBadge label={releaseUi.label} variant={releaseUi.variant} />
                ) : (
                  <span className="text-muted-foreground text-xs">{row.releaseType}</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {isSales ? fullLabel : formatAmount(parseAmount(row.plannedAmount))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {isSales ? payableLabel : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">
                {isSales ? <span title={row.earnedPeriod ?? undefined}>{kpiPctLabel}</span> : '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(parseAmount(row.releaseAmount))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.includedAmount
                  ? formatAmount(parseAmount(row.includedAmount))
                  : formatAmount(parseAmount(row.releaseAmount))}
              </TableCell>
              <TableCell className="text-right">
                {row.kpiBurnedAmount ? (
                  <div className="tabular-nums">
                    <div>{formatAmount(parseAmount(row.kpiBurnedAmount))}</div>
                    {row.kpiBurnedReason ? (
                      <p className="text-muted-foreground mt-0.5 text-left text-xs leading-snug">
                        {row.kpiBurnedReason}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.payrollCarryOverAmount
                  ? formatAmount(parseAmount(row.payrollCarryOverAmount))
                  : '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(parseAmount(row.paidAmount))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(parseAmount(row.remainingAmount))}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function SalaryMonthBonusBreakdown({ detail }: { detail: SalaryLineMonthDetail }) {
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
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          By bonus source
        </p>
        <BonusBySourceTable rows={detail.bonusBreakdown} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          Releases this month
        </p>
        <BonusReleaseLinesTable rows={detail.bonusBreakdown} />
      </div>
    </div>
  );
}
