'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Gauge, Target, Timer, TrendingUp, Wallet } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { CompanyStatCard } from '@/features/hr/components/MyCompanyHubCards';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import type { StatusVariant } from '@/components/shared/StatusBadge';
import { dashboardApi, type DashboardControlCenterProjection } from '@/lib/api/dashboard';

type KpiGateRow = {
  label: string;
  threshold: string;
  payout: string;
  variant: StatusVariant;
};

const KPI_GATE_TABLE: KpiGateRow[] = [
  { label: 'Strong delivery', threshold: '>= 70%', payout: '100%', variant: 'green' },
  { label: 'Warning zone', threshold: '50% - 69%', payout: '50%', variant: 'amber' },
  { label: 'Failed gate', threshold: '< 50%', payout: '0%', variant: 'red' },
];

export default function KpiPage() {
  const [control, setControl] = useState<DashboardControlCenterProjection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setControl(await dashboardApi.getControlCenter());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = control?.metrics;
  const priorityCount = useMemo(
    () => control?.priorities.length ?? 0,
    [control?.priorities.length],
  );

  useCompanySectionTabs('kpi');

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompanyStatCard
          icon={<Target size={16} aria-hidden />}
          label="Open tasks"
          value={String(metrics?.openTasks ?? '—')}
        />
        <CompanyStatCard
          icon={<TrendingUp size={16} aria-hidden />}
          label="Open deals"
          value={String(metrics?.openDeals ?? '—')}
        />
        <CompanyStatCard
          icon={<Wallet size={16} aria-hidden />}
          label="Pending invoices"
          value={String(metrics?.pendingInvoices ?? '—')}
        />
        <CompanyStatCard
          icon={<Timer size={16} aria-hidden />}
          label="Priority alerts"
          value={String(priorityCount)}
        />
      </div>

      <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
        <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Gauge size={15} />
            </div>
            <h2 className="text-foreground text-sm font-semibold">KPI gate</h2>
          </div>
          {loading ? (
            <span className="text-muted-foreground text-xs">Loading…</span>
          ) : (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
              {KPI_GATE_TABLE.length}
            </span>
          )}
        </div>
        <ul className="relative mt-3 flex flex-col gap-1">
          {KPI_GATE_TABLE.map((row, index) => (
            <li key={row.label} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
              <span className="text-primary w-6 shrink-0 text-xs font-semibold tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">{row.label}</p>
                <p className="text-muted-foreground text-xs">Attainment {row.threshold}</p>
              </div>
              <span className="text-foreground text-lg font-semibold tabular-nums">
                {row.payout}
              </span>
              <StatusBadge label="Payout" variant={row.variant} />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
        <div className="bg-primary/15 pointer-events-none absolute -bottom-10 -left-8 size-28 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <ArrowUpRight size={15} />
          </div>
          <h2 className="text-foreground text-sm font-semibold">Where the scorecard is used</h2>
        </div>
        <ul className="relative mt-3 grid gap-1 sm:grid-cols-2">
          {(
            [
              ['/dashboard', 'Dashboard'],
              ['/reports', 'Reports'],
              ['/my-company/kpi-policies', 'KPI gate policies'],
              ['/finance/payroll', 'Payroll'],
              ['/tasks', 'Tasks'],
            ] as const
          ).map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="hover:bg-muted/60 flex items-center gap-2.5 rounded-xl px-1.5 py-1.5"
              >
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                  <ArrowUpRight size={14} />
                </span>
                <span className="text-foreground text-sm font-medium">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
