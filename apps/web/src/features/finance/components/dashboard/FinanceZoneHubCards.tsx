'use client';

import Link from 'next/link';
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
import {
  FINANCE_ZONE_HUB_CARD_THEMES,
  type FinanceZoneHubCardAction,
  type FinanceZoneHubCardTheme,
} from '@/features/finance/constants/finance-zone-hub-card-theme';
import type { FinanceZoneHubMetrics } from './build-finance-zone-hub-metrics';

type FinanceZoneHubCardsProps = {
  metrics: FinanceZoneHubMetrics;
};

export function FinanceZoneHubCards({ metrics }: FinanceZoneHubCardsProps) {
  return (
    <section aria-label="Finance module zones">
      <h2 className="text-foreground text-sm font-semibold tracking-tight">Finance zones</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewZoneCard metrics={metrics.overview} />
        <ZoneHubCard
          theme={FINANCE_ZONE_HUB_CARD_THEMES.revenue}
          title="Revenue"
          description="Orders, invoices, payments, subscriptions"
          icon={ShoppingCart}
          primaryLabel="Outstanding"
          primaryValue={formatAmount(metrics.revenue.outstandingAmount)}
          secondaryLabel="MRR"
          secondaryValue={formatAmount(metrics.revenue.monthlyRecurringRevenue)}
          actions={[
            {
              href: '/finance/subscriptions',
              label: 'Open Subscriptions',
            },
          ]}
        />
        <ZoneHubCard
          theme={FINANCE_ZONE_HUB_CARD_THEMES.expenses}
          title="Expenses"
          description="Pay Now, plans, client services"
          icon={Receipt}
          primaryLabel="Open cards"
          primaryValue={String(metrics.expenses.openCardCount)}
          secondaryLabel="Amount"
          secondaryValue={formatAmount(metrics.expenses.openCardAmount)}
          actions={[
            {
              href: '/finance/expenses/plans',
              label: 'Open Expenses Plan',
            },
          ]}
        />
        <ZoneHubCard
          theme={FINANCE_ZONE_HUB_CARD_THEMES.payroll}
          title="Payroll"
          description="Payroll runs, salary, bonus pools"
          icon={Banknote}
          primaryLabel="Open runs"
          primaryValue={String(metrics.payroll.runCount)}
          secondaryLabel="Remaining"
          secondaryValue={formatAmount(metrics.payroll.remainingPayable)}
          actions={[
            {
              href: '/finance/bonuses',
              label: 'Open Bonus',
            },
          ]}
        />
      </div>
    </section>
  );
}

function OverviewZoneCard({ metrics }: { metrics: FinanceZoneHubMetrics['overview'] }) {
  const theme = FINANCE_ZONE_HUB_CARD_THEMES.overview;

  return (
    <ZoneHubCardShell
      theme={theme}
      title="Overview"
      description="Dashboard, P&amp;L reports, operational journal"
      icon={FileChartColumn}
      primaryLabel="Reconciliation alerts"
      primaryValue={String(metrics.reconciliationWarningCount)}
      secondaryLabel="You are here"
      secondaryValue="Dashboard"
      actions={[
        { href: '/finance/reports', label: 'Reports', icon: FileChartColumn },
        { href: '/finance/journal', label: 'Journal', icon: ScrollText },
      ]}
    />
  );
}

type ZoneHubCardProps = {
  theme: FinanceZoneHubCardTheme;
  title: string;
  description: string;
  icon: typeof ShoppingCart;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  actions: FinanceZoneHubCardAction[];
};

function ZoneHubCard(props: ZoneHubCardProps) {
  return <ZoneHubCardShell {...props} />;
}

function ZoneHubCardShell({
  theme,
  title,
  description,
  icon: Icon,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  actions,
}: ZoneHubCardProps) {
  return (
    <article className="bg-card flex h-full flex-col rounded-2xl p-5 shadow-sm ring-1 shadow-black/[0.04] ring-black/[0.04]">
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', theme.iconShell)}>
          <Icon size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">{description}</p>
        </div>
      </div>

      <div className="border-border/70 mt-4 border-t pt-4">
        <dl className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <MetricCell
            label={primaryLabel}
            value={primaryValue}
            valueClassName={theme.metricValue}
          />
          <div className="bg-border h-10 w-px shrink-0" aria-hidden />
          <MetricCell
            label={secondaryLabel}
            value={secondaryValue}
            valueClassName={theme.metricValue}
          />
        </dl>
      </div>

      <div className="mt-auto flex gap-2 pt-4">
        {actions.map((action) => (
          <ZoneHubCardActionLink key={action.href} action={action} theme={theme} />
        ))}
      </div>
    </article>
  );
}

function MetricCell({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <dt className="text-muted-foreground text-[11px] leading-tight">{label}</dt>
      <dd className={cn('mt-1 truncate text-sm font-bold tabular-nums', valueClassName)}>
        {value}
      </dd>
    </div>
  );
}

function ZoneHubCardActionLink({
  action,
  theme,
}: {
  action: FinanceZoneHubCardAction;
  theme: FinanceZoneHubCardTheme;
}) {
  const ActionIcon = action.icon;

  return (
    <Link
      href={action.href}
      className={cn(
        'inline-flex min-w-0 flex-1 flex-nowrap items-center justify-center gap-1 rounded-xl px-2.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors',
        theme.actionShell,
      )}
    >
      {ActionIcon ? <ActionIcon size={14} className="shrink-0" aria-hidden /> : null}
      <span className="min-w-0 truncate">{action.label}</span>
      <ArrowUpRight size={12} className="shrink-0 opacity-80" aria-hidden />
    </Link>
  );
}
