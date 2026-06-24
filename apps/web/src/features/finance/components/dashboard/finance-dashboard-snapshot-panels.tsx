import Link from 'next/link';
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Landmark,
  PieChart,
  Receipt,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/features/finance/constants/finance';
import { FINANCE_DASHBOARD_PANEL_CARD_CLASS } from '@/features/finance/constants/finance-dashboard-card-hover';
import { payrollRunsListHref } from '@/features/finance/constants/payroll-runs-list-url';
import type {
  FinanceDashboardExpenseBucket,
  FinanceDashboardPayrollRunsSummary,
} from './finance-dashboard-data';

const PAYROLL_TILE_SHELL = 'bg-sky-50/90 dark:bg-sky-950/25';
const EXPENSE_TILE_SHELL = 'bg-muted/35';
const EXPENSE_SUMMARY_BANNER =
  'bg-orange-50/90 border-orange-100 text-orange-950 dark:bg-orange-950/30 dark:border-orange-900/40 dark:text-orange-100';

export function PayrollRunsSnapshot({ payroll }: { payroll: FinanceDashboardPayrollRunsSummary }) {
  const href = payrollRunsListHref();

  return (
    <div className={FINANCE_DASHBOARD_PANEL_CARD_CLASS}>
      <SnapshotPanelHeader
        icon={Landmark}
        iconShellClass="bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
        title="Payroll runs"
        href={href}
        linkLabel="Open payroll"
        linkClassName="text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
        description="Workspace totals from GET /payroll-runs/stats (all runs). Not filtered by the invoice period selector above."
      />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SnapshotMetricTile
          shellClass={PAYROLL_TILE_SHELL}
          icon={ClipboardList}
          iconShellClass="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
          label="Runs in scope"
          value={String(payroll.runCount)}
        />
        <SnapshotMetricTile
          shellClass={PAYROLL_TILE_SHELL}
          icon={CircleDollarSign}
          iconShellClass="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
          label="Total payable"
          value={formatAmount(payroll.totalPayable)}
        />
        <SnapshotMetricTile
          shellClass={PAYROLL_TILE_SHELL}
          icon={CheckCircle2}
          iconShellClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          label="Total paid"
          value={formatAmount(payroll.totalPaid)}
        />
        <SnapshotMetricTile
          shellClass={PAYROLL_TILE_SHELL}
          icon={PieChart}
          iconShellClass="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
          label="Remaining"
          value={formatAmount(payroll.totalRemaining)}
        />
      </div>
    </div>
  );
}

export function ExpenseCardsSnapshot({ buckets }: { buckets: FinanceDashboardExpenseBucket[] }) {
  const href = '/finance/expenses';
  const totalRemaining = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const totalCards = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const dueSoonBucket =
    buckets.find((bucket) => bucket.key === 'dueSoon') ??
    ({
      key: 'dueSoon',
      label: 'Due soon (7d)',
      count: 0,
      amount: 0,
    } satisfies FinanceDashboardExpenseBucket);

  return (
    <div className={FINANCE_DASHBOARD_PANEL_CARD_CLASS}>
      <SnapshotPanelHeader
        icon={Receipt}
        iconShellClass="bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
        title="Outgoing expenses"
        href={href}
        linkLabel="Open expense board"
        linkClassName="text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200"
        description="Unpaid expense cards by workflow bucket. Due now uses the explicit DUE_NOW status; other lanes follow board rules and due dates in the selected period."
      />
      {buckets.length === 0 ? (
        <p className="text-muted-foreground mt-5 text-sm">No open expense cards in this period.</p>
      ) : (
        <>
          <div
            className={cn(
              'mt-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold',
              EXPENSE_SUMMARY_BANNER,
            )}
          >
            <Wallet
              size={18}
              className="shrink-0 text-orange-600 dark:text-orange-300"
              aria-hidden
            />
            <span className="tabular-nums">
              {formatAmount(totalRemaining)} remaining across {totalCards} cards
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SnapshotMetricTile
              shellClass={EXPENSE_TILE_SHELL}
              icon={Calendar}
              iconShellClass="bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
              label={dueSoonBucket.label}
              value={String(dueSoonBucket.count)}
            />
            <SnapshotMetricTile
              shellClass={EXPENSE_TILE_SHELL}
              icon={CreditCard}
              iconShellClass="bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
              label="Cards"
              value={String(totalCards)}
            />
            <SnapshotMetricTile
              shellClass={EXPENSE_TILE_SHELL}
              icon={Banknote}
              iconShellClass="bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
              label="Amount"
              value={formatAmount(totalRemaining)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function SnapshotPanelHeader({
  icon: Icon,
  iconShellClass,
  title,
  href,
  linkLabel,
  linkClassName,
  description,
}: {
  icon: typeof Landmark;
  iconShellClass: string;
  title: string;
  href: string;
  linkLabel: string;
  linkClassName: string;
  description: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('rounded-full p-2.5', iconShellClass)}>
            <Icon size={20} aria-hidden />
          </div>
          <h2 className="text-foreground text-lg font-semibold">{title}</h2>
        </div>
        <Link
          href={href}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors',
            linkClassName,
          )}
        >
          {linkLabel}
          <ArrowUpRight size={14} aria-hidden />
        </Link>
      </div>
      <p className="text-muted-foreground mt-3 text-sm leading-snug">{description}</p>
    </>
  );
}

function SnapshotMetricTile({
  shellClass,
  icon: Icon,
  iconShellClass,
  label,
  value,
}: {
  shellClass: string;
  icon: typeof ClipboardList;
  iconShellClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-xl px-3 py-4 text-center', shellClass)}>
      <div className={cn('rounded-full p-2', iconShellClass)}>
        <Icon size={16} aria-hidden />
      </div>
      <p className="text-muted-foreground mt-2 text-[11px] leading-tight">{label}</p>
      <p className="text-foreground mt-1 text-sm leading-tight font-bold tabular-nums">{value}</p>
    </div>
  );
}
