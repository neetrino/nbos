'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, DollarSign, Download, RefreshCw } from 'lucide-react';
import { ErrorState } from '@/components/shared';
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
  PayrollRunsSnapshot,
  RecentPayments,
  ReconciliationSnapshot,
  UpcomingInvoices,
} from '@/features/finance/components/dashboard/FinanceDashboardSections';
import {
  buildFinanceDashboardData,
  type FinanceDashboardData,
  type FinanceKpi,
} from '@/features/finance/components/dashboard/finance-dashboard-data';
import { financeDashboardPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { downloadFinanceDashboardCsv } from '@/features/finance/utils/export-finance-dashboard-csv';
import { financeSummaryApi } from '@/lib/api/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

export default function FinanceDashboardPage() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [loadError, setLoadError] = useState<string | null>(null);

  useFinanceDocumentTitle(financeDashboardPageTitle());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const summary = await financeSummaryApi.getDashboard(getFinancePeriodParams(period));
      setData(buildFinanceDashboardData(summary));
    } catch (caught) {
      setData(null);
      setLoadError(
        getApiErrorMessage(
          caught,
          'Could not load finance dashboard data. Check your connection and try again.',
        ),
      );
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
      <ErrorState
        title="Finance dashboard unavailable"
        description={
          loadError ?? 'Could not load finance dashboard data. Check your connection and try again.'
        }
        actionLabel="Retry"
        onRetry={fetchDashboard}
      />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        period={period}
        setPeriod={setPeriod}
        onRefresh={fetchDashboard}
        onExportCsv={() => {
          downloadFinanceDashboardCsv(data, period);
          toast.success('Finance dashboard snapshot exported');
        }}
      />
      <KpiCards kpis={buildKpis(data)} />

      <PayrollRunsSnapshot payroll={data.payrollRuns} />

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
  onExportCsv,
}: {
  period: FinancePeriod;
  setPeriod: (period: FinancePeriod) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Finance Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Revenue, invoices, order coverage, payment analytics, and workspace payroll run totals
          from live finance data.
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
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          aria-label="Refresh finance overview"
        >
          <RefreshCw size={16} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onExportCsv}
          aria-label="Export finance dashboard snapshot as CSV"
          title="KPIs, invoice mix, reconciliation, recent payments, upcoming invoices, and payroll run totals for this period"
        >
          <Download size={16} />
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
