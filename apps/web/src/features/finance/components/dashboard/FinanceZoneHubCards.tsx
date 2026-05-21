'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Banknote,
  FileChartColumn,
  Receipt,
  ScrollText,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/features/finance/constants/finance';
import type { FinanceSidebarZoneId } from '@/features/finance/constants/finance-zone-storage';
import { financeZoneEntryLabel } from '@/features/finance/constants/finance-zone-entry-label';
import { useFinanceZoneHref } from '@/features/finance/hooks/use-finance-zone-href';
import type { FinanceZoneHubMetrics } from './build-finance-zone-hub-metrics';

type FinanceZoneHubCardsProps = {
  metrics: FinanceZoneHubMetrics;
};

export function FinanceZoneHubCards({ metrics }: FinanceZoneHubCardsProps) {
  const pathname = usePathname();

  return (
    <section aria-label="Finance module zones">
      <h2 className="text-foreground text-sm font-semibold tracking-tight">Finance zones</h2>
      <p className="text-muted-foreground mt-1 text-xs">
        Jump to Revenue, Expenses, Payroll, or analytics. Links open your last page in each zone.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewZoneCard metrics={metrics.overview} />
        <OperationalZoneCard
          pathname={pathname}
          zone="revenue"
          title="Revenue"
          description="Orders, invoices, payments, subscriptions"
          icon={ShoppingCart}
          iconClassName="bg-emerald-100 text-emerald-700"
          primaryLabel="Outstanding"
          primaryValue={formatAmount(metrics.revenue.outstandingAmount)}
          secondaryLabel="MRR"
          secondaryValue={formatAmount(metrics.revenue.monthlyRecurringRevenue)}
        />
        <OperationalZoneCard
          pathname={pathname}
          zone="expenses"
          title="Expenses"
          description="Pay Now, plans, client services"
          icon={Receipt}
          iconClassName="bg-amber-100 text-amber-700"
          primaryLabel="Open cards"
          primaryValue={String(metrics.expenses.openCardCount)}
          secondaryLabel="Amount"
          secondaryValue={formatAmount(metrics.expenses.openCardAmount)}
        />
        <OperationalZoneCard
          pathname={pathname}
          zone="payroll"
          title="Payroll"
          description="Payroll runs, salary, bonus pools"
          icon={Banknote}
          iconClassName="bg-violet-100 text-violet-700"
          primaryLabel="Open runs"
          primaryValue={String(metrics.payroll.runCount)}
          secondaryLabel="Remaining"
          secondaryValue={formatAmount(metrics.payroll.remainingPayable)}
        />
      </div>
    </section>
  );
}

function OverviewZoneCard({ metrics }: { metrics: FinanceZoneHubMetrics['overview'] }) {
  return (
    <article className="border-border bg-card flex flex-col rounded-2xl border p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-100 p-2.5 text-sky-700">
          <FileChartColumn size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground font-semibold">Overview</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            Dashboard, P&amp;L reports, operational journal
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Reconciliation alerts</dt>
          <dd className="text-foreground mt-0.5 font-semibold tabular-nums">
            {metrics.reconciliationWarningCount}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">You are here</dt>
          <dd className="text-foreground mt-0.5 font-medium">Dashboard</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <ZoneSubLink href="/finance/reports" label="Reports" />
        <ZoneSubLink href="/finance/journal" label="Journal" />
      </div>
    </article>
  );
}

type OperationalZoneCardProps = {
  pathname: string;
  zone: Exclude<FinanceSidebarZoneId, 'overview'>;
  title: string;
  description: string;
  icon: typeof ShoppingCart;
  iconClassName: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
};

function OperationalZoneCard({
  pathname,
  zone,
  title,
  description,
  icon: Icon,
  iconClassName,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
}: OperationalZoneCardProps) {
  const href = useFinanceZoneHref(zone, pathname);
  const entryLabel = financeZoneEntryLabel(href);

  return (
    <article className="border-border bg-card flex flex-col rounded-2xl border p-5">
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', iconClassName)}>
          <Icon size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">{description}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">{primaryLabel}</dt>
          <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{primaryValue}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{secondaryLabel}</dt>
          <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{secondaryValue}</dd>
        </div>
      </dl>
      <Link
        href={href}
        className="border-border text-foreground hover:bg-muted/60 mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
      >
        Open {entryLabel}
        <ArrowUpRight size={14} aria-hidden />
      </Link>
    </article>
  );
}

function ZoneSubLink({ href, label }: { href: string; label: string }) {
  const Icon = label === 'Journal' ? ScrollText : FileChartColumn;
  return (
    <Link
      href={href}
      className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
    >
      <Icon size={12} aria-hidden />
      {label}
      <ArrowUpRight size={10} aria-hidden />
    </Link>
  );
}
