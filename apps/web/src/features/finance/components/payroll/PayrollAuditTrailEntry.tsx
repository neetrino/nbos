'use client';

import Link from 'next/link';
import { payrollAuditActionLabel } from '@/features/finance/constants/payroll-run-ui';
import {
  extractMaterializedExpenseIds,
  formatPayrollAuditChangesBody,
} from '@/features/finance/utils/payroll-audit-changes-display';
import type { PayrollAuditTrailRow } from '@/lib/api/payroll-runs';

export interface PayrollAuditTrailEntryProps {
  row: PayrollAuditTrailRow;
  actorLabel: string;
  formatAt: (iso: string) => string;
}

export function PayrollAuditTrailEntry({ row, actorLabel, formatAt }: PayrollAuditTrailEntryProps) {
  const expenseIds = extractMaterializedExpenseIds(row.changes);

  return (
    <li className="border-border border-t py-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground text-sm font-medium">
            {payrollAuditActionLabel(row.action)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">{actorLabel}</p>
        </div>
        <time
          className="text-muted-foreground shrink-0 text-xs tabular-nums"
          dateTime={row.createdAt}
        >
          {formatAt(row.createdAt)}
        </time>
      </div>
      <pre className="bg-muted/50 text-muted-foreground mt-2 max-h-40 overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
        {formatPayrollAuditChangesBody(row.changes)}
      </pre>
      {expenseIds.length > 0 ? (
        <div className="mt-2">
          <p className="text-muted-foreground text-xs font-medium">Materialized expenses</p>
          <ul className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
            {expenseIds.map((expenseId) => (
              <li key={expenseId}>
                <Link
                  href={`/finance/expenses/${expenseId}`}
                  className="text-primary inline-flex max-w-full items-baseline gap-1 text-xs font-medium hover:underline"
                  title={expenseId}
                >
                  <span>Open expense</span>
                  <span className="text-muted-foreground font-mono text-[11px] font-normal break-all">
                    {expenseId.length > 14 ? `${expenseId.slice(0, 14)}…` : expenseId}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}
