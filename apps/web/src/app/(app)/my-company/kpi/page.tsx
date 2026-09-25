'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Target, TrendingUp, Wallet, Timer } from 'lucide-react';
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
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Company KPI runtime: cross-module signals, scorecard gate policy, and links to execution
        modules.
      </p>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="border-border bg-card rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">KPI Gate Policy</h2>
          {loading ? <span className="text-muted-foreground text-xs">Loading metrics…</span> : null}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {KPI_GATE_TABLE.map((row) => (
            <div key={row.label} className="border-border rounded-xl border p-3">
              <div className="mb-2">
                <StatusBadge label={row.label} variant={row.variant} />
              </div>
              <p className="text-foreground text-sm font-medium">{row.threshold}</p>
              <p className="text-muted-foreground text-xs">Bonus payout: {row.payout}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <h2 className="mb-2 text-sm font-semibold">Scorecard Module Links</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ['/dashboard', 'Dashboard'],
              ['/reports', 'Reports'],
              ['/my-company/kpi-policies', 'KPI gate policies'],
              ['/finance/payroll', 'Payroll'],
              ['/tasks', 'Tasks'],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="border-border hover:border-primary/40 rounded-xl border px-3 py-2 text-sm font-medium"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
