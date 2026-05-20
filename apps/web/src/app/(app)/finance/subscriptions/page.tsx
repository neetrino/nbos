'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FilterBar, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_TYPES, SUBSCRIPTION_STATUSES } from '@/features/finance/constants/finance';
import { subscriptionsListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY } from '@/features/finance/constants/subscription-partner-drilldown';
import { usePartnerFilterOptions } from '@/features/finance/hooks/usePartnerFilterOptions';
import { SubscriptionsPageContent } from '@/features/finance/components/subscriptions/SubscriptionsPageContent';
import { useSubscriptionGrid } from '@/features/finance/components/subscriptions/use-subscription-grid';
import { SubscriptionsPageHeader } from '@/features/finance/components/subscriptions/SubscriptionsPageHeader';
import { SubscriptionStatsCards } from '@/features/finance/components/subscriptions/SubscriptionStatsCards';
import { useSubscriptionsCsvExport } from '@/features/finance/components/subscriptions/use-subscriptions-csv-export';
import { useSubscriptionsScopeStatsCsvExport } from '@/features/finance/components/subscriptions/use-subscriptions-scope-stats-csv-export';
import { useSubscriptionsPageState } from '@/features/finance/components/subscriptions/useSubscriptionsPageState';
import { buildSubscriptionPageQueries } from '@/features/finance/utils/build-subscription-page-queries';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { SubscriptionFormDialog } from '@/features/finance/components/subscriptions/SubscriptionFormDialog';
import type { Subscription } from '@/lib/api/finance';

function SubscriptionsPageInner() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const partnerIdFromUrl = searchParams.get(PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY);

  const page = useSubscriptionsPageState({ partnerIdFromUrl });
  const [gridYear, setGridYear] = useState(() => new Date().getFullYear());
  const subscriptionGrid = useSubscriptionGrid({
    year: gridYear,
    search: page.search,
    filters: page.filtersForBar,
    partnerIdFromUrl: partnerIdFromUrl?.trim() || null,
  });
  const { exportCsvSubmitting, handleExportCsv } = useSubscriptionsCsvExport(
    page.subscriptionListExportParams,
  );
  const { partnerFilterOptions, partnerOptionsLoadError, clearPartnerOptionsLoadError } =
    usePartnerFilterOptions();

  const subscriptionStatsQueryParams = useMemo(() => {
    return buildSubscriptionPageQueries(
      {
        filters: page.filters,
        search: page.search,
        partnerIdFromUrl: partnerIdFromUrl?.trim() || null,
      },
      page.period,
    ).statsParams;
  }, [page.filters, page.period, page.search, partnerIdFromUrl]);

  const { handleExportScopeStatsCsv } = useSubscriptionsScopeStatsCsvExport(page.stats, {
    period: page.period,
    statsQuery: subscriptionStatsQueryParams,
  });

  useFinanceDocumentTitle(subscriptionsListPageTitle(Boolean(partnerIdFromUrl?.trim())));

  const totalMRR = Number(page.stats?.monthlyRevenue ?? 0);
  const activeCount = page.subscriptions.filter(
    (subscription) => subscription.status === 'ACTIVE',
  ).length;
  const activeSubscriptions = page.stats?.activeSubscriptions ?? activeCount;

  const clearPartnerDrilldown = () => {
    router.replace(pathname ?? '/finance/subscriptions');
    page.setFilters((prev) => {
      const next = { ...prev };
      delete next.partner;
      return next;
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    if (partnerIdFromUrl && key === 'partner') {
      router.replace(pathname ?? '/finance/subscriptions');
    }
    page.setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubscriptionCreated = useCallback(
    (created: Subscription) => {
      void page.fetchSubscriptions();
      subscriptionGrid.retry();
      router.push(`/finance/subscriptions/${created.id}`);
    },
    [page, router, subscriptionGrid],
  );

  const handleClearFilters = () => {
    if (partnerIdFromUrl) {
      router.replace(pathname ?? '/finance/subscriptions');
    }
    page.setFilters({});
  };

  const filterConfigs = [
    {
      key: 'type',
      label: 'Type',
      options: SUBSCRIPTION_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: SUBSCRIPTION_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    },
    ...(partnerFilterOptions.length > 0
      ? [
          {
            key: 'partner',
            label: 'Partner',
            options: partnerFilterOptions,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <SubscriptionsPageHeader
        activeSubscriptions={activeSubscriptions}
        totalMRR={totalMRR}
        period={page.period}
        onPeriodChange={page.setPeriod}
        onExportCsv={handleExportCsv}
        exportDisabled={page.loading || exportCsvSubmitting}
        exportInProgress={exportCsvSubmitting}
        statsExportDisabled={page.loading || !page.stats}
        onExportScopeStatsCsv={handleExportScopeStatsCsv}
        onCreateClick={() => setCreateOpen(true)}
      />

      <SubscriptionStatsCards subscriptions={page.subscriptions} stats={page.stats} />

      {partnerIdFromUrl ? (
        <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <p className="text-foreground max-w-prose">
            Showing subscriptions linked to this partner (server filter).
          </p>
          <Button variant="outline" size="sm" type="button" onClick={clearPartnerDrilldown}>
            Clear filter
          </Button>
        </div>
      ) : null}

      <FilterBar
        search={page.search}
        onSearchChange={page.setSearch}
        searchPlaceholder="Search by code, project, company, partner…"
        filters={filterConfigs}
        filterValues={page.filtersForBar}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {partnerOptionsLoadError ? (
        <ListMutationErrorBanner
          message={partnerOptionsLoadError}
          onDismiss={clearPartnerOptionsLoadError}
          dismissAriaLabel="Dismiss partner load error"
          dismissText="Dismiss"
        />
      ) : null}

      <SubscriptionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSaved={handleSubscriptionCreated}
      />

      <SubscriptionsPageContent
        gridYear={gridYear}
        onGridYearChange={setGridYear}
        gridPayload={subscriptionGrid.data}
        gridLoading={subscriptionGrid.loading}
        gridError={subscriptionGrid.error}
        onGridRetry={subscriptionGrid.retry}
        subscriptions={page.subscriptions}
        loading={page.loading}
        error={page.error}
        mutationError={page.mutationError}
        onDismissMutationError={page.clearMutationError}
        activatingId={page.activatingId}
        cancellingId={page.cancellingId}
        holdingId={page.holdingId}
        onRetry={page.fetchSubscriptions}
        onActivate={page.handleActivate}
        onCancel={page.handleCancel}
        onHold={page.handleHold}
        onPartnerLinked={page.handlePartnerLinked}
      />
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SubscriptionsPageInner />
    </Suspense>
  );
}
