'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DetailSheetSection } from '@/components/shared';
import { DetailSheetTabBar } from '@/components/shared/DetailSheetTabBar';
import {
  portfolioApi,
  type CompanyPortfolioResponse,
  type ContactPortfolioResponse,
} from '@/lib/api/client-portfolio';
import { ClientPortfolioQuickActions } from './ClientPortfolioQuickActions';
import { ClientPortfolioTabPanels } from './ClientPortfolioTabPanels';
import {
  CLIENT_DETAIL_GENERAL_TAB,
  CLIENT_DETAIL_PORTFOLIO_TABS,
  detailTabsForMask,
  type ClientDetailTabDefinition,
  type ClientDetailTabId,
  type ClientEmbeddedPortfolioTabId,
} from './client-portfolio-tabs';

type PortfolioData = ContactPortfolioResponse | CompanyPortfolioResponse;
type PortfolioVariant = 'contact' | 'company';
type PortfolioDataFor<T extends PortfolioVariant> = T extends 'contact'
  ? ContactPortfolioResponse
  : CompanyPortfolioResponse;

interface UseClientPortfolioDataOptions<T extends PortfolioVariant> {
  variant: T;
  entityId: string | null;
}

export function useClientPortfolioData<T extends PortfolioVariant>({
  variant,
  entityId,
}: UseClientPortfolioDataOptions<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioDataFor<T> | null>(null);

  const load = useCallback(async () => {
    if (!entityId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next =
        variant === 'contact'
          ? await portfolioApi.getByContact(entityId)
          : await portfolioApi.getByCompany(entityId);
      setData(next as PortfolioDataFor<T>);
    } catch {
      setError('Portfolio could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [entityId, variant]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs = useMemo<ReadonlyArray<ClientDetailTabDefinition>>(
    () =>
      data
        ? detailTabsForMask(data.accessMask)
        : [CLIENT_DETAIL_GENERAL_TAB, ...CLIENT_DETAIL_PORTFOLIO_TABS],
    [data],
  );

  return { data, loading, error, tabs, reload: load };
}

interface ClientDetailTabBarProps {
  activeTab: ClientDetailTabId;
  tabs: ReadonlyArray<ClientDetailTabDefinition>;
  onSelect: (tab: ClientDetailTabId) => void;
}

export function ClientDetailTabBar({ activeTab, tabs, onSelect }: ClientDetailTabBarProps) {
  return (
    <DetailSheetTabBar
      tabs={tabs.map((tab) => ({ value: tab.id, label: tab.label, icon: tab.icon }))}
      activeTab={activeTab}
      onTabChange={(value) => onSelect(value as ClientDetailTabId)}
    />
  );
}

interface ClientPortfolioPanelProps {
  tab: ClientEmbeddedPortfolioTabId;
  data: PortfolioData | null;
  loading: boolean;
  error: string | null;
  variant: 'contact' | 'company';
  onRetry: () => void;
}

export function ClientPortfolioPanel({
  tab,
  data,
  loading,
  error,
  variant,
  onRetry,
}: ClientPortfolioPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3 px-7 py-5">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error) return <ClientPortfolioError message={error} onRetry={onRetry} />;
  if (!data) return <p className="text-muted-foreground px-7 py-5 text-sm">No portfolio data.</p>;
  return (
    <div className="space-y-6 px-7 py-5">
      <ClientPortfolioTabPanels tab={tab} data={data} variant={variant} onRetry={onRetry} />
    </div>
  );
}

interface ClientPortfolioGeneralActionsProps {
  variant: 'contact' | 'company';
  entityId: string;
  data: PortfolioData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ClientPortfolioGeneralActions({
  variant,
  entityId,
  data,
  loading,
  error,
  onRetry,
}: ClientPortfolioGeneralActionsProps) {
  return (
    <DetailSheetSection title="Quick actions">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : data ? (
        <ClientPortfolioQuickActions
          variant={variant}
          entityId={entityId}
          data={data}
          layout="rail"
        />
      ) : (
        <ClientPortfolioInlineError
          message={error ?? 'Portfolio actions are unavailable.'}
          onRetry={onRetry}
        />
      )}
    </DetailSheetSection>
  );
}

interface ClientPortfolioAnalyticsProps {
  data: PortfolioData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ClientPortfolioAnalytics({
  data,
  loading,
  error,
  onRetry,
}: ClientPortfolioAnalyticsProps) {
  if (loading) {
    return (
      <DetailSheetSection title="Analytics">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </DetailSheetSection>
    );
  }
  if (!data) {
    return (
      <DetailSheetSection title="Analytics">
        <ClientPortfolioInlineError
          message={error ?? 'Portfolio analytics are unavailable.'}
          onRetry={onRetry}
        />
      </DetailSheetSection>
    );
  }

  const summary = data.summary;
  const mask = data.accessMask;
  return (
    <DetailSheetSection title="Analytics">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Projects" value={summary.projectCount} />
        {'companyCount' in summary ? (
          <MetricCard label="Companies" value={summary.companyCount} />
        ) : null}
        {mask.support ? <MetricCard label="Open tickets" value={summary.openTicketCount} /> : null}
        {mask.finance ? (
          <MetricCard label="Outstanding invoices" value={summary.outstandingInvoiceCount} />
        ) : null}
        {mask.finance ? (
          <MetricCard label="Overdue / awaiting" value={summary.overdueInvoiceCount} />
        ) : null}
        {mask.finance ? (
          <MetricCard label="Paid invoices" value={summary.paidInvoiceCount} />
        ) : null}
        {mask.subscriptions ? (
          <MetricCard label="Active subscriptions" value={summary.subscriptionActiveCount} />
        ) : null}
      </div>
    </DetailSheetSection>
  );
}

function ClientPortfolioError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-7 py-5">
      <ClientPortfolioInlineError message={message} onRetry={onRetry} />
    </div>
  );
}

function ClientPortfolioInlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-muted-foreground rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/20">
      <p>{message}</p>
      <Button type="button" variant="link" size="sm" className="mt-1 h-auto px-0" onClick={onRetry}>
        <RefreshCw size={13} className="mr-1" />
        Retry
      </Button>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-background/80 rounded-xl border p-4">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
