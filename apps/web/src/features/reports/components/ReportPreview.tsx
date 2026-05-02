'use client';

import { formatCompanyPnlAmount } from '@/features/finance/utils/company-pnl-format';
import type { ReportDefinition } from '@/lib/api/reports';
import type { ReportPreviewData } from '../report-preview-model';

const EMPTY_VALUE = '—';

interface MetricItem {
  label: string;
  value: string;
}

interface BarItem {
  label: string;
  value: number;
}

export function ReportPreview({
  definition,
  previewData,
}: {
  definition: ReportDefinition;
  previewData: ReportPreviewData;
}) {
  const metrics = getPreviewMetrics(definition.key, previewData);
  const bars = getPreviewBars(definition.key, previewData);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-muted/40 rounded-xl p-3">
            <p className="text-muted-foreground text-xs font-medium">{metric.label}</p>
            <p className="text-foreground mt-1 text-lg font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>
      {bars.length > 0 ? <MiniBarList items={bars} /> : null}
    </div>
  );
}

function getPreviewMetrics(reportKey: string, data: ReportPreviewData): MetricItem[] {
  if (reportKey === 'company-pnl') return companyPnlMetrics(data);
  if (reportKey === 'cash-flow') return cashFlowMetrics(data);
  if (reportKey === 'project-pnl') return projectPnlMetrics(data);
  if (reportKey === 'mrr-subscription-revenue') return mrrMetrics(data);
  if (reportKey === 'expense-plan-vs-actual') return expensePlanMetrics(data);
  if (reportKey === 'payroll-report') return payrollMetrics(data);
  if (reportKey === 'sales-pipeline-health') return salesMetrics(data);
  if (reportKey === 'marketing-source-performance') return marketingMetrics(data);
  if (reportKey === 'project-delivery-overview') return deliveryMetrics(data);
  if (reportKey === 'specialist-workload-scorecard') return specialistMetrics(data);
  return fallbackMetrics();
}

function getPreviewBars(reportKey: string, data: ReportPreviewData): BarItem[] {
  if (reportKey === 'sales-pipeline-health') {
    return (data.deals?.byStatus ?? []).map((row) => ({ label: row.status, value: row._count }));
  }
  if (reportKey === 'marketing-source-performance' && data.marketing) {
    return [
      { label: 'Attributed deals', value: data.marketing.totals.attributedDeals },
      { label: 'Won attributed', value: data.marketing.totals.wonAttributedDeals },
      { label: 'Missing links', value: data.marketing.totals.missingFinanceLinks },
    ];
  }
  if (reportKey === 'project-delivery-overview') {
    return [
      ...statusRowsToBars(data.products?.byStatus ?? []),
      ...statusRowsToBars(data.extensions?.byStatus ?? []),
    ].slice(0, 6);
  }
  if (reportKey === 'specialist-workload-scorecard') {
    return (data.tasks?.byPriority ?? []).map((row) => ({
      label: row.priority,
      value: row._count,
    }));
  }
  return [];
}

function companyPnlMetrics(data: ReportPreviewData): MetricItem[] {
  const report = data.finance.companyPnl;
  return [
    { label: 'Revenue', value: money(report?.revenue.incomingPayments) },
    { label: 'Net profit', value: money(report?.profitability.netProfit) },
    { label: 'Margin', value: percent(report?.profitability.marginPercent) },
    { label: 'Payments', value: count(report?.revenue.paymentCount) },
  ];
}

function cashFlowMetrics(data: ReportPreviewData): MetricItem[] {
  const report = data.finance.cashFlow;
  return [
    { label: 'Incoming', value: money(report?.actuals.realIncoming) },
    { label: 'Outgoing', value: money(report?.actuals.realOutgoing) },
    { label: 'Net movement', value: money(report?.actuals.netMovement) },
    { label: 'Backlog debt', value: money(report?.backlogDebt.amount) },
  ];
}

function projectPnlMetrics(data: ReportPreviewData): MetricItem[] {
  const report = data.finance.projectPnl;
  return [
    { label: 'Projects', value: count(report?.totals.projectCount) },
    { label: 'Revenue', value: money(report?.totals.revenue) },
    { label: 'Net profit', value: money(report?.totals.netProfit) },
    { label: 'Margin', value: percent(report?.totals.marginPercent) },
  ];
}

function mrrMetrics(data: ReportPreviewData): MetricItem[] {
  const report = data.finance.mrrSubscriptionRevenue;
  return [
    { label: 'Active MRR', value: money(report?.active.activeMrr) },
    { label: 'Active subs', value: count(report?.active.activeSubscriptionCount) },
    { label: 'New MRR', value: money(report?.movement.newMrr) },
    { label: 'Churned MRR', value: money(report?.movement.churnedMrr) },
  ];
}

function expensePlanMetrics(data: ReportPreviewData): MetricItem[] {
  const report = data.finance.expensePlanVsActual;
  return [
    { label: 'Planned', value: money(report?.totals.plannedAmount) },
    { label: 'Paid', value: money(report?.totals.paidAmount) },
    { label: 'Variance', value: money(report?.totals.variancePlannedVsPaid) },
    { label: 'Plans', value: count(report?.totals.planCount) },
  ];
}

function payrollMetrics(data: ReportPreviewData): MetricItem[] {
  const report = data.finance.payrollReport;
  return [
    { label: 'Payable', value: money(report?.totals.totalPayable) },
    { label: 'Paid', value: money(report?.totals.totalPaid) },
    { label: 'Remaining', value: money(report?.totals.totalRemaining) },
    { label: 'Payroll / revenue', value: percent(report?.totals.payrollAsPercentOfRevenue) },
  ];
}

function salesMetrics(data: ReportPreviewData): MetricItem[] {
  const won = data.deals?.byStatus.find((row) => row.status === 'WON')?._count ?? 0;
  return [
    { label: 'Leads', value: count(data.leads?.total) },
    { label: 'Deals', value: count(data.deals?.total) },
    { label: 'Won deals', value: count(won) },
    { label: 'Top source', value: data.leads?.bySource[0]?.source ?? EMPTY_VALUE },
  ];
}

function marketingMetrics(data: ReportPreviewData): MetricItem[] {
  const summary = data.marketing;
  return [
    { label: 'Activities', value: count(summary?.totals.activities) },
    { label: 'Paid revenue', value: money(summary?.money.paidRevenue) },
    { label: 'ROAS', value: ratio(summary?.money.roas) },
    { label: 'Warnings', value: count(summary?.warnings.length) },
  ];
}

function deliveryMetrics(data: ReportPreviewData): MetricItem[] {
  return [
    { label: 'Products', value: count(data.products?.total) },
    { label: 'Extensions', value: count(data.extensions?.total) },
    { label: 'Product states', value: count(data.products?.byStatus.length) },
    {
      label: 'Extension states',
      value: count(data.extensions?.byStatus.length),
    },
  ];
}

function specialistMetrics(data: ReportPreviewData): MetricItem[] {
  const totalTasks = (data.tasks?.byStatus ?? []).reduce((sum, row) => sum + row._count, 0);
  return [
    { label: 'Tasks', value: count(totalTasks) },
    { label: 'Statuses', value: count(data.tasks?.byStatus.length) },
    { label: 'Priority buckets', value: count(data.tasks?.byPriority.length) },
    { label: 'Main priority', value: data.tasks?.byPriority[0]?.priority ?? EMPTY_VALUE },
  ];
}

function fallbackMetrics(): MetricItem[] {
  return [
    { label: 'Data', value: 'Configured' },
    { label: 'Export', value: 'CSV' },
  ];
}

function MiniBarList({ items }: { items: BarItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="grid grid-cols-[120px_1fr_42px] items-center gap-2 text-xs"
        >
          <span className="text-muted-foreground truncate">{item.label}</span>
          <span className="bg-muted block h-2 rounded-full">
            <span
              className={`bg-primary block h-2 rounded-full ${barWidthClass(item.value, maxValue)}`}
            />
          </span>
          <span className="text-right font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function statusRowsToBars(source: Array<{ status: string; _count: number }>): BarItem[] {
  return source.map((row) => ({ label: row.status, value: row._count }));
}

function barWidthClass(value: number, maxValue: number): string {
  const pct = maxValue === 0 ? 0 : Math.round((value / maxValue) * 100);
  if (pct >= 90) return 'w-full';
  if (pct >= 75) return 'w-10/12';
  if (pct >= 60) return 'w-8/12';
  if (pct >= 45) return 'w-6/12';
  if (pct >= 30) return 'w-4/12';
  if (pct >= 15) return 'w-2/12';
  return 'w-1/12';
}

function money(value: string | number | undefined): string {
  if (value === undefined) return EMPTY_VALUE;
  return typeof value === 'string'
    ? formatCompanyPnlAmount(value)
    : formatCompanyPnlAmount(String(value));
}

function count(value: number | undefined): string {
  return value === undefined ? EMPTY_VALUE : new Intl.NumberFormat('en-US').format(value);
}

function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY_VALUE : `${value.toFixed(1)}%`;
}

function ratio(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY_VALUE : `${value.toFixed(2)}x`;
}
