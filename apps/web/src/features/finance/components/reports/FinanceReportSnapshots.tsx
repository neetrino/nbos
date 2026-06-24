import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarRange,
  CreditCard,
  FileText,
  Landmark,
  Layers,
  Percent,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { formatCompanyPnlAmount, formatCompanyPnlMargin } from '../../utils/company-pnl-format';
import type {
  CashFlowReport,
  CompanyPnlReport,
  ExpensePlanVsActualReport,
  MrrSubscriptionRevenueReport,
  PayrollReport,
  ProjectPnlReport,
} from '@/lib/api/finance-reports';
import {
  formatReportPercent,
  REPORT_SNAPSHOT_METRIC_GRID,
  ReportSnapshot,
  SnapshotMetric,
} from './finance-report-snapshot-primitives';

export function CompanyPnlSnapshot({ report }: { report: CompanyPnlReport }) {
  return (
    <ReportSnapshot
      title="Company P&L v1 snapshot"
      subtitle="Cash-basis aggregate from live payments and expense payments."
    >
      <div className={REPORT_SNAPSHOT_METRIC_GRID}>
        <SnapshotMetric
          icon={TrendingUp}
          iconShellClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          label="Incoming payments"
          value={formatCompanyPnlAmount(report.revenue.incomingPayments)}
        />
        <SnapshotMetric
          icon={Wallet}
          label="Actual costs"
          value={formatCompanyPnlAmount(report.costs.actualExpensePayments)}
        />
        <SnapshotMetric
          icon={BarChart3}
          label="Net profit"
          value={formatCompanyPnlAmount(report.profitability.netProfit)}
        />
        <SnapshotMetric
          icon={Percent}
          label="Margin"
          value={formatCompanyPnlMargin(report.profitability.marginPercent)}
        />
        <SnapshotMetric
          label="Payment rows"
          value={String(report.revenue.paymentCount)}
          icon={Users}
        />
        <SnapshotMetric
          label="Expense payment rows"
          value={String(report.costs.expensePaymentCount)}
          icon={FileText}
        />
        <SnapshotMetric
          icon={Landmark}
          label="Payroll control paid"
          value={formatCompanyPnlAmount(report.payrollControl.payrollRunPaid)}
          fullWidth
        />
      </div>
    </ReportSnapshot>
  );
}

export function CashFlowSnapshot({ report }: { report: CashFlowReport }) {
  const firstBucket = report.forecast.buckets[0];

  return (
    <ReportSnapshot
      title="Cash Flow v1 snapshot"
      subtitle="Real cash movement plus 30/60/90 day forecast from open finance facts."
    >
      <div className={REPORT_SNAPSHOT_METRIC_GRID}>
        <SnapshotMetric
          icon={TrendingUp}
          iconShellClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          label="Real incoming"
          value={formatCompanyPnlAmount(report.actuals.realIncoming)}
        />
        <SnapshotMetric
          icon={ArrowDownLeft}
          label="Real outgoing"
          value={formatCompanyPnlAmount(report.actuals.realOutgoing)}
        />
        <SnapshotMetric
          icon={BarChart3}
          label="Net movement"
          value={formatCompanyPnlAmount(report.actuals.netMovement)}
        />
        <SnapshotMetric
          icon={Receipt}
          label="Backlog debt"
          value={formatCompanyPnlAmount(report.backlogDebt.amount)}
        />
        {firstBucket ? (
          <>
            <SnapshotMetric
              icon={CalendarRange}
              label="30d expected incoming"
              value={formatCompanyPnlAmount(firstBucket.expectedIncoming)}
            />
            <SnapshotMetric
              icon={CalendarRange}
              label="30d expected outgoing"
              value={formatCompanyPnlAmount(firstBucket.expectedOutgoing)}
            />
            <SnapshotMetric
              icon={TrendingUp}
              label="30d net expected"
              value={formatCompanyPnlAmount(firstBucket.netExpected)}
              fullWidth
            />
          </>
        ) : null}
      </div>
    </ReportSnapshot>
  );
}

export function ExpensePlanVsActualSnapshot({ report }: { report: ExpensePlanVsActualReport }) {
  const topCategory = report.byCategory.reduce<(typeof report.byCategory)[number] | null>(
    (current, row) =>
      !current || Number(row.plannedAmount) > Number(current.plannedAmount) ? row : current,
    null,
  );

  return (
    <ReportSnapshot
      title="Expense Plan vs Actual v1 snapshot"
      subtitle="Plan/card/payment roll-up by category from live Expense Plan data."
    >
      <div className={REPORT_SNAPSHOT_METRIC_GRID}>
        <SnapshotMetric
          icon={Layers}
          label="Planned"
          value={formatCompanyPnlAmount(report.totals.plannedAmount)}
        />
        <SnapshotMetric
          icon={CreditCard}
          label="Generated cards"
          value={formatCompanyPnlAmount(report.totals.generatedCardAmount)}
        />
        <SnapshotMetric
          icon={Banknote}
          label="Paid"
          value={formatCompanyPnlAmount(report.totals.paidAmount)}
        />
        <SnapshotMetric
          icon={Percent}
          label="Variance"
          value={formatCompanyPnlAmount(report.totals.variancePlannedVsPaid)}
        />
        <SnapshotMetric label="Plans" value={String(report.totals.planCount)} icon={FileText} />
        <SnapshotMetric label="Cards" value={String(report.totals.cardCount)} icon={CreditCard} />
        <SnapshotMetric
          icon={Receipt}
          label="Payments"
          value={String(report.totals.paymentCount)}
          fullWidth
        />
      </div>
      {topCategory ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Largest category in scope: <span className="font-medium">{topCategory.category}</span>{' '}
          planned {formatCompanyPnlAmount(topCategory.plannedAmount)}.
        </p>
      ) : null}
    </ReportSnapshot>
  );
}

export function MrrSubscriptionRevenueSnapshot({
  report,
}: {
  report: MrrSubscriptionRevenueReport;
}) {
  const topType = report.active.byType.reduce<(typeof report.active.byType)[number] | null>(
    (current, row) =>
      !current || Number(row.activeMrr) > Number(current.activeMrr) ? row : current,
    null,
  );

  return (
    <ReportSnapshot
      title="MRR / Subscription Revenue v1 snapshot"
      subtitle="Active MRR and paid subscription revenue from live subscription data."
    >
      <div className={REPORT_SNAPSHOT_METRIC_GRID}>
        <SnapshotMetric
          icon={TrendingUp}
          iconShellClass="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
          label="Active MRR"
          value={formatCompanyPnlAmount(report.active.activeMrr)}
        />
        <SnapshotMetric
          icon={Banknote}
          label="Paid subscription revenue"
          value={formatCompanyPnlAmount(report.paidRevenue.paidSubscriptionRevenue)}
        />
        <SnapshotMetric
          icon={ArrowUpRight}
          label="New MRR"
          value={formatCompanyPnlAmount(report.movement.newMrr)}
        />
        <SnapshotMetric
          icon={TrendingDown}
          label="Churned MRR"
          value={formatCompanyPnlAmount(report.movement.churnedMrr)}
        />
        <SnapshotMetric
          label="Active subscriptions"
          value={String(report.active.activeSubscriptionCount)}
          icon={Users}
        />
        <SnapshotMetric
          label="Subscription payments"
          value={String(report.paidRevenue.paymentCount)}
          icon={CreditCard}
        />
        <SnapshotMetric
          icon={FileText}
          label="Subscription invoices"
          value={String(report.paidRevenue.invoiceCount)}
          fullWidth
        />
      </div>
      {topType ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Top active type: <span className="font-medium">{topType.type}</span> at{' '}
          {formatCompanyPnlAmount(topType.activeMrr)} MRR.
        </p>
      ) : null}
    </ReportSnapshot>
  );
}

export function PayrollReportSnapshot({ report }: { report: PayrollReport }) {
  const largestStatus = report.byStatus.reduce<(typeof report.byStatus)[number] | null>(
    (current, row) =>
      !current || Number(row.totalPayable) > Number(current.totalPayable) ? row : current,
    null,
  );

  return (
    <ReportSnapshot
      title="Payroll Report v1 snapshot"
      subtitle="Payroll payable, paid, remaining and revenue ratio from live payroll data."
    >
      <div className={REPORT_SNAPSHOT_METRIC_GRID}>
        <SnapshotMetric
          icon={Wallet}
          label="Total payable"
          value={formatCompanyPnlAmount(report.totals.totalPayable)}
        />
        <SnapshotMetric
          icon={Banknote}
          label="Paid"
          value={formatCompanyPnlAmount(report.totals.totalPaid)}
        />
        <SnapshotMetric
          icon={Receipt}
          label="Remaining"
          value={formatCompanyPnlAmount(report.totals.totalRemaining)}
        />
        <SnapshotMetric
          icon={Percent}
          label="Payroll / revenue"
          value={formatReportPercent(report.totals.payrollAsPercentOfRevenue)}
        />
        <SnapshotMetric
          label="Payroll runs"
          value={String(report.totals.payrollRunCount)}
          icon={Landmark}
        />
        <SnapshotMetric
          label="Salary lines"
          value={String(report.totals.salaryLineCount)}
          icon={Users}
        />
        <SnapshotMetric
          icon={TrendingUp}
          label="Salary expense paid"
          value={formatCompanyPnlAmount(report.totals.salaryExpensePaid)}
          fullWidth
        />
      </div>
      {largestStatus ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Largest status bucket: <span className="font-medium">{largestStatus.status}</span> at{' '}
          {formatCompanyPnlAmount(largestStatus.totalPayable)} payable.
        </p>
      ) : null}
    </ReportSnapshot>
  );
}

export function ProjectPnlSnapshot({ report }: { report: ProjectPnlReport }) {
  const topProject = report.topProjects[0] ?? null;

  return (
    <ReportSnapshot
      title="Project P&L v1 snapshot"
      subtitle="Cash-basis project profitability from payments and actual expense payments."
    >
      <div className={REPORT_SNAPSHOT_METRIC_GRID}>
        <SnapshotMetric
          icon={TrendingUp}
          iconShellClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          label="Revenue"
          value={formatCompanyPnlAmount(report.totals.revenue)}
        />
        <SnapshotMetric
          icon={Wallet}
          label="Actual costs"
          value={formatCompanyPnlAmount(report.totals.actualCosts)}
        />
        <SnapshotMetric
          icon={BarChart3}
          label="Net profit"
          value={formatCompanyPnlAmount(report.totals.netProfit)}
        />
        <SnapshotMetric
          icon={Percent}
          label="Margin"
          value={formatReportPercent(report.totals.marginPercent)}
        />
        <SnapshotMetric label="Projects" value={String(report.totals.projectCount)} icon={Layers} />
        <SnapshotMetric
          label="Payments"
          value={String(report.totals.paymentCount)}
          icon={CreditCard}
        />
        <SnapshotMetric
          icon={FileText}
          label="Expense payments"
          value={String(report.totals.expensePaymentCount)}
          fullWidth
        />
      </div>
      {topProject ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Top project:{' '}
          <span className="font-medium">
            {topProject.projectCode ? `${topProject.projectCode} · ` : ''}
            {topProject.projectName}
          </span>{' '}
          at {formatCompanyPnlAmount(topProject.netProfit)} net profit.
        </p>
      ) : null}
    </ReportSnapshot>
  );
}
