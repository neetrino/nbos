import type { ReactNode } from 'react';
import { formatCompanyPnlAmount, formatCompanyPnlMargin } from '../../utils/company-pnl-format';
import type {
  CashFlowReport,
  CompanyPnlReport,
  ExpensePlanVsActualReport,
  MrrSubscriptionRevenueReport,
  PayrollReport,
  ProjectPnlReport,
} from '@/lib/api/finance-reports';

export function CompanyPnlSnapshot({ report }: { report: CompanyPnlReport }) {
  return (
    <ReportSnapshot
      title="Company P&L v1 snapshot"
      subtitle="Cash-basis aggregate from live payments and expense payments."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotMetric
          label="Incoming payments"
          value={formatCompanyPnlAmount(report.revenue.incomingPayments)}
        />
        <SnapshotMetric
          label="Actual costs"
          value={formatCompanyPnlAmount(report.costs.actualExpensePayments)}
        />
        <SnapshotMetric
          label="Net profit"
          value={formatCompanyPnlAmount(report.profitability.netProfit)}
        />
        <SnapshotMetric
          label="Margin"
          value={formatCompanyPnlMargin(report.profitability.marginPercent)}
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SnapshotMetric label="Payment rows" value={String(report.revenue.paymentCount)} compact />
        <SnapshotMetric
          label="Expense payment rows"
          value={String(report.costs.expensePaymentCount)}
          compact
        />
        <SnapshotMetric
          label="Payroll control paid"
          value={formatCompanyPnlAmount(report.payrollControl.payrollRunPaid)}
          compact
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotMetric
          label="Real incoming"
          value={formatCompanyPnlAmount(report.actuals.realIncoming)}
        />
        <SnapshotMetric
          label="Real outgoing"
          value={formatCompanyPnlAmount(report.actuals.realOutgoing)}
        />
        <SnapshotMetric
          label="Net movement"
          value={formatCompanyPnlAmount(report.actuals.netMovement)}
        />
        <SnapshotMetric
          label="Backlog debt"
          value={formatCompanyPnlAmount(report.backlogDebt.amount)}
        />
      </div>
      {firstBucket ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <SnapshotMetric
            label="30d expected incoming"
            value={formatCompanyPnlAmount(firstBucket.expectedIncoming)}
            compact
          />
          <SnapshotMetric
            label="30d expected outgoing"
            value={formatCompanyPnlAmount(firstBucket.expectedOutgoing)}
            compact
          />
          <SnapshotMetric
            label="30d net expected"
            value={formatCompanyPnlAmount(firstBucket.netExpected)}
            compact
          />
        </div>
      ) : null}
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotMetric
          label="Planned"
          value={formatCompanyPnlAmount(report.totals.plannedAmount)}
        />
        <SnapshotMetric
          label="Generated cards"
          value={formatCompanyPnlAmount(report.totals.generatedCardAmount)}
        />
        <SnapshotMetric label="Paid" value={formatCompanyPnlAmount(report.totals.paidAmount)} />
        <SnapshotMetric
          label="Variance"
          value={formatCompanyPnlAmount(report.totals.variancePlannedVsPaid)}
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SnapshotMetric label="Plans" value={String(report.totals.planCount)} compact />
        <SnapshotMetric label="Cards" value={String(report.totals.cardCount)} compact />
        <SnapshotMetric label="Payments" value={String(report.totals.paymentCount)} compact />
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotMetric
          label="Active MRR"
          value={formatCompanyPnlAmount(report.active.activeMrr)}
        />
        <SnapshotMetric
          label="Paid subscription revenue"
          value={formatCompanyPnlAmount(report.paidRevenue.paidSubscriptionRevenue)}
        />
        <SnapshotMetric label="New MRR" value={formatCompanyPnlAmount(report.movement.newMrr)} />
        <SnapshotMetric
          label="Churned MRR"
          value={formatCompanyPnlAmount(report.movement.churnedMrr)}
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SnapshotMetric
          label="Active subscriptions"
          value={String(report.active.activeSubscriptionCount)}
          compact
        />
        <SnapshotMetric
          label="Subscription payments"
          value={String(report.paidRevenue.paymentCount)}
          compact
        />
        <SnapshotMetric
          label="Subscription invoices"
          value={String(report.paidRevenue.invoiceCount)}
          compact
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotMetric
          label="Total payable"
          value={formatCompanyPnlAmount(report.totals.totalPayable)}
        />
        <SnapshotMetric label="Paid" value={formatCompanyPnlAmount(report.totals.totalPaid)} />
        <SnapshotMetric
          label="Remaining"
          value={formatCompanyPnlAmount(report.totals.totalRemaining)}
        />
        <SnapshotMetric
          label="Payroll / revenue"
          value={formatPercent(report.totals.payrollAsPercentOfRevenue)}
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SnapshotMetric
          label="Payroll runs"
          value={String(report.totals.payrollRunCount)}
          compact
        />
        <SnapshotMetric
          label="Salary lines"
          value={String(report.totals.salaryLineCount)}
          compact
        />
        <SnapshotMetric
          label="Salary expense paid"
          value={formatCompanyPnlAmount(report.totals.salaryExpensePaid)}
          compact
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotMetric label="Revenue" value={formatCompanyPnlAmount(report.totals.revenue)} />
        <SnapshotMetric
          label="Actual costs"
          value={formatCompanyPnlAmount(report.totals.actualCosts)}
        />
        <SnapshotMetric
          label="Net profit"
          value={formatCompanyPnlAmount(report.totals.netProfit)}
        />
        <SnapshotMetric label="Margin" value={formatPercent(report.totals.marginPercent)} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SnapshotMetric label="Projects" value={String(report.totals.projectCount)} compact />
        <SnapshotMetric label="Payments" value={String(report.totals.paymentCount)} compact />
        <SnapshotMetric
          label="Expense payments"
          value={String(report.totals.expensePaymentCount)}
          compact
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

function ReportSnapshot({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="border-border bg-card rounded-2xl border p-5 xl:col-span-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-foreground text-lg font-semibold">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          CASH basis
        </span>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function formatPercent(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(2)}%`;
}

function SnapshotMetric({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="border-border rounded-xl border p-3">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className={`text-foreground mt-1 font-semibold ${compact ? 'text-base' : 'text-xl'}`}>
        {value}
      </p>
    </div>
  );
}
