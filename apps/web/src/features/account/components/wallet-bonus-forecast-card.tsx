'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  nextPayrollBonusLineAmount,
  summarizeWalletBonusForecast,
} from '@/features/finance/utils/wallet-bonus-forecast-summary';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

export function WalletBonusForecastCard({ data }: { data: EmployeeWalletSnapshot }) {
  const summary = useMemo(() => summarizeWalletBonusForecast(data.bonuses), [data.bonuses]);
  const nextPayrollBonuses = nextPayrollBonusLineAmount(data.nextPayroll);

  const incomingTotal = summary.incomingPlanned + summary.inProgressPlanned;
  const earnedPath = summary.nextPayrollRemaining + summary.paidFromReleases;

  return (
    <section className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-foreground text-sm font-semibold">Bonus outlook</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Planned amounts from your bonus entries — not cash in bank. Incoming depends on client
        payments and eligibility; earned path follows releases and payroll.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="border-border bg-muted/15 rounded-lg border px-3 py-2.5">
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Incoming / predicted
          </dt>
          <dd className="text-foreground mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(incomingTotal)}
          </dd>
          <dd className="text-muted-foreground mt-1 text-[11px] leading-snug">
            Potential {formatAmount(summary.incomingPlanned)} · In progress{' '}
            {formatAmount(summary.inProgressPlanned)}
          </dd>
        </div>
        <div className="border-border bg-muted/15 rounded-lg border px-3 py-2.5">
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Earned / payout path
          </dt>
          <dd className="text-foreground mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(earnedPath)}
          </dd>
          <dd className="text-muted-foreground mt-1 text-[11px] leading-snug">
            Payroll queue {formatAmount(summary.nextPayrollRemaining)} · Paid releases{' '}
            {formatAmount(summary.paidFromReleases)}
          </dd>
        </div>
      </dl>
      {nextPayrollBonuses != null && nextPayrollBonuses > 0 ? (
        <p className="text-muted-foreground mt-3 text-xs leading-snug">
          Open payroll month includes {formatAmount(nextPayrollBonuses)} on your salary line (may
          differ from per-entry totals when KPI applies).
        </p>
      ) : null}
      {summary.correctionsPlanned > 0 ? (
        <p className="text-muted-foreground mt-2 text-xs leading-snug">
          Corrections / clawback entries: {formatAmount(summary.correctionsPlanned)} planned.
        </p>
      ) : null}
    </section>
  );
}
