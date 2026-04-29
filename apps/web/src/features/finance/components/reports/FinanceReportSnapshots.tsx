import type { ReactNode } from 'react';
import { formatCompanyPnlAmount, formatCompanyPnlMargin } from '../../utils/company-pnl-format';
import type { CashFlowReport, CompanyPnlReport } from '@/lib/api/finance-reports';

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
