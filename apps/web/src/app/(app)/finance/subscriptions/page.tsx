'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  IntegratedSearchFilters,
  ListMutationErrorBanner,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Plus, TableProperties } from 'lucide-react';
import {
  FINANCE_PERIOD_OPTIONS,
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_STATUSES,
} from '@/features/finance/constants/finance';
import { subscriptionsListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY } from '@/features/finance/constants/subscription-partner-drilldown';
import { usePartnerFilterOptions } from '@/features/finance/hooks/usePartnerFilterOptions';
import { SubscriptionsPageContent } from '@/features/finance/components/subscriptions/SubscriptionsPageContent';
import { useSubscriptionGrid } from '@/features/finance/components/subscriptions/use-subscription-grid';
import { useSubscriptionsCsvExport } from '@/features/finance/components/subscriptions/use-subscriptions-csv-export';
import { useSubscriptionsScopeStatsCsvExport } from '@/features/finance/components/subscriptions/use-subscriptions-scope-stats-csv-export';
import { useSubscriptionsPageState } from '@/features/finance/components/subscriptions/useSubscriptionsPageState';
import { buildSubscriptionPageQueries } from '@/features/finance/utils/build-subscription-page-queries';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { SubscriptionFormDialog } from '@/features/finance/components/subscriptions/SubscriptionFormDialog';
import { SubscriptionDetailSheet } from '@/features/finance/components/subscriptions/SubscriptionDetailSheet';
import {
  OPEN_SUBSCRIPTION_QUERY,
  subscriptionsListWithOpenSubscriptionHref,
} from '@/features/finance/constants/subscription-deep-link';
import type { Subscription } from '@/lib/api/finance';

function SubscriptionsPageInner() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const partnerIdFromUrl = searchParams.get(PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY);
  const openSubscriptionIdFromUrl = searchParams.get(OPEN_SUBSCRIPTION_QUERY)?.trim() || null;

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

  const openSubscriptionDetail = useCallback(
    (subscriptionId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_SUBSCRIPTION_QUERY, subscriptionId);
      router.push(`${pathname ?? '/finance/subscriptions'}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSubscriptionSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has(OPEN_SUBSCRIPTION_QUERY)) return;
      params.delete(OPEN_SUBSCRIPTION_QUERY);
      const qs = params.toString();
      router.replace(
        qs
          ? `${pathname ?? '/finance/subscriptions'}?${qs}`
          : (pathname ?? '/finance/subscriptions'),
      );
    },
    [pathname, router, searchParams],
  );

  const handleSubscriptionCreated = useCallback(
    (created: Subscription) => {
      void page.fetchSubscriptions();
      subscriptionGrid.retry();
      router.push(subscriptionsListWithOpenSubscriptionHref(created.id));
    },
    [page, router, subscriptionGrid],
  );

  const handleClearFilters = () => {
    if (partnerIdFromUrl) {
      router.replace(pathname ?? '/finance/subscriptions');
    }
    page.setFilters({});
  };

  const filterConfigs = useMemo(
    () => [
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
    ],
    [partnerFilterOptions],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={page.search}
          onSearchChange={page.setSearch}
          searchPlaceholder="Search by code, project, company, partner…"
          filters={filterConfigs}
          filterValues={page.filtersForBar}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
        />
      ),
      trailing: (
        <>
          <div className="border-border flex rounded-lg border p-1">
            {FINANCE_PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={page.period === option.value ? 'secondary' : 'ghost'}
                size="sm"
                type="button"
                onClick={() => page.setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page.loading || !page.stats}
            onClick={() => handleExportScopeStatsCsv()}
            aria-label="Export subscription scope statistics as CSV"
          >
            <TableProperties size={16} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page.loading || exportCsvSubmitting}
            onClick={() => {
              void handleExportCsv();
            }}
            aria-label="Export subscriptions as CSV"
          >
            {exportCsvSubmitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Download size={16} aria-hidden />
            )}
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            New Subscription
          </Button>
        </>
      ),
    }),
    [
      exportCsvSubmitting,
      filterConfigs,
      handleClearFilters,
      handleExportCsv,
      handleExportScopeStatsCsv,
      handleFilterChange,
      page.filtersForBar,
      page.loading,
      page.period,
      page.search,
      page.setPeriod,
      page.setSearch,
      page.stats,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
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
        listLoading={page.loading}
        listError={page.error}
        mutationError={page.mutationError}
        onDismissMutationError={page.clearMutationError}
        onListRetry={page.fetchSubscriptions}
        activatingId={page.activatingId}
        cancellingId={page.cancellingId}
        holdingId={page.holdingId}
        onActivate={page.handleActivate}
        onCancel={page.handleCancel}
        onHold={page.handleHold}
        onOpenSubscription={openSubscriptionDetail}
      />

      <SubscriptionDetailSheet
        subscriptionId={openSubscriptionIdFromUrl}
        open={Boolean(openSubscriptionIdFromUrl)}
        onOpenChange={handleSubscriptionSheetOpenChange}
        onSubscriptionUpdated={() => {
          void page.fetchSubscriptions();
          subscriptionGrid.retry();
        }}
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
