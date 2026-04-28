'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FINANCE_PERIOD_OPTIONS,
  getFinancePeriodParams,
  type FinancePeriod,
  formatAmount,
} from '@/features/finance/constants/finance';
import {
  DashboardLoadingSkeleton,
  FinanceNotes,
  InvoiceDistribution,
  KpiCards,
  RecentPayments,
  ReconciliationSnapshot,
  UpcomingInvoices,
} from '@/features/finance/components/dashboard/FinanceDashboardSections';
import {
  buildFinanceDashboardData,
  type FinanceDashboardData,
  type FinanceKpi,
} from '@/features/finance/components/dashboard/finance-dashboard-data';
import { financeSummaryApi } from '@/lib/api/finance';

export default function FinanceDashboardPage() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await financeSummaryApi.getDashboard(getFinancePeriodParams(period));
      setData(buildFinanceDashboardData(summary));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Could not load finance dashboard data</p>
        <Button onClick={fetchDashboard}>
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader period={period} setPeriod={setPeriod} onRefresh={fetchDashboard} />
      <KpiCards kpis={buildKpis(data)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InvoiceDistribution items={data.invoiceStatusItems} />
        <RecentPayments items={data.recentPayments} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReconciliationSnapshot data={data} />
        <UpcomingInvoices items={data.upcomingInvoices} />
      </div>

      <FinanceNotes />
    </div>
  );
}

function DashboardHeader({
  period,
  setPeriod,
  onRefresh,
}: {
  period: FinancePeriod;
  setPeriod: (period: FinancePeriod) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Finance Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Revenue, invoices, order coverage, and payment analytics from live finance data.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="border-border flex rounded-lg border p-1">
          {FINANCE_PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw size={16} />
        </Button>
      </div>
    </div>
  );
}

function buildKpis(data: FinanceDashboardData): FinanceKpi[] {
  return [
    {
      label: 'Total Revenue',
      value: formatAmount(data.totalRevenue),
      change: 'From paid invoices',
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
    },
    {
      label: 'Outstanding',
      value: formatAmount(data.outstandingAmount),
      change: 'All unpaid invoices',
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
    },
    {
      label: 'Overdue',
      value: formatAmount(data.overdueAmount),
      change: 'Invoices in delayed state',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
    },
    {
      label: 'MRR',
      value: formatAmount(data.monthlyRecurringRevenue),
      change: 'Active subscriptions only',
      icon: RefreshCw,
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
    },
  ];
}
